import type { NextApiRequest, NextApiResponse } from 'next';
import type { Browser } from 'puppeteer-core';
import clientPromise from '../../lib/mongodb';
import { generateSecureQRCode, QRBookingData } from '../../lib/secure-qr';
import { generateTicketHtml, TicketTemplateData } from '../../lib/ticket-template';
import { verifyDownloadToken } from '../../lib/download-token';
import { rateLimit } from '../../lib/rate-limit';

// ─── Browser lifecycle ───────────────────────────────────────────────────────
// TTL-cached browser instance. In prod, Chromium is expensive to launch (~3–5s).
// Reusing the same instance across warm invocations drops PDF time to ~600ms.
// The browser is evicted after 45s of idle to free memory before Vercel recycles the function.

let _browser: Browser | null = null;
let _browserUsedAt = 0;
const BROWSER_TTL_MS = 45_000; // evict after 45s idle

async function getBrowser(): Promise<Browser> {
  const now = Date.now();

  // Evict stale browser
  if (_browser && now - _browserUsedAt > BROWSER_TTL_MS) {
    console.log('[generate-ticket] Evicting stale browser (idle > 45s)');
    try { await _browser.close(); } catch {}
    _browser = null;
  }

  if (!_browser) {
    if (process.env.NODE_ENV === 'development') {
      const puppeteer = (await import('puppeteer')).default;
      _browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      }) as unknown as Browser;
    } else {
      const puppeteerCore = (await import('puppeteer-core')).default;
      const chromium     = (await import('@sparticuz/chromium')).default;
      _browser = await puppeteerCore.launch({
        args: [
          ...chromium.args,
          '--disable-dev-shm-usage', // prevent /dev/shm OOM on Lambda
          // '--no-zygote' and '--single-process' are already in chromium.args — do not duplicate
        ],
        defaultViewport: { width: 600, height: 1000 },
        executablePath: await chromium.executablePath(),
        headless: 'shell' as any, // @sparticuz/chromium ships chrome-headless-shell, not chrome
      });
    }
    console.log('[generate-ticket] Browser launched');
  }

  _browserUsedAt = Date.now();
  return _browser;
}

// ─── PDF cache ───────────────────────────────────────────────────────────────
// Short-lived in-memory cache. Serves repeated downloads of the same ticket
// from cache without re-launching Puppeteer. Works across warm invocations.
const _pdfCache = new Map<string, { buf: Buffer; at: number }>();
const PDF_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { bookingId, token } = req.query;

  // ── 1. Validate inputs ─────────────────────────────────────────────────────
  if (!bookingId || typeof bookingId !== 'string') {
    return res.status(400).json({ message: 'Booking ID is required' });
  }

  // ── 2. Rate limiting ───────────────────────────────────────────────────────
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unknown';

  if (!rateLimit(ip, 8, 60_000)) {
    return res.status(429).json({
      message: 'Too many requests. Please wait a moment before trying again.',
    });
  }

  // ── 3. Token verification (production only) ────────────────────────────────
  // In development, skip token check so you can test the endpoint directly.
  // In production, a valid signed token must be obtained via /api/bookings/retrieve first.
  if (process.env.NODE_ENV !== 'development') {
    if (!token || typeof token !== 'string') {
      return res.status(401).json({
        message: 'Download link is invalid. Please go to "Retrieve My Ticket" and try again.',
      });
    }

    const check = verifyDownloadToken(token, bookingId);
    if (!check.valid) {
      const message =
        check.reason === 'expired'
          ? 'Your download link has expired (30 min limit). Please retrieve your tickets again.'
          : 'Invalid download link. Please go to "Retrieve My Ticket" and try again.';
      return res.status(401).json({ message });
    }
  }

  // ── 4. Serve from cache if available ──────────────────────────────────────
  const cached = _pdfCache.get(bookingId);
  if (cached && Date.now() - cached.at < PDF_CACHE_TTL) {
    console.log(`[generate-ticket] Cache HIT for ${bookingId}`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=HH-TICKET-${bookingId}.pdf`);
    res.setHeader('Content-Length', cached.buf.length);
    res.setHeader('X-Cache', 'HIT');
    return res.end(cached.buf);
  }

  try {
    const client = await clientPromise;
    const db     = client.db();

    // ── 5. Look up booking ───────────────────────────────────────────────────
    const booking = await db.collection('bookings').findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // ── 6. Fetch event data from CMS ─────────────────────────────────────────
    const nextShowDoc = await db
      .collection('homepage_content')
      .findOne({ type: 'next_show' });

    const eventTitle    = nextShowDoc?.title                                   || 'The Humours Hub: Open Mic Night';
    const eventDate     = nextShowDoc?.metadata?.date && nextShowDoc?.metadata?.month
                            ? `${nextShowDoc.metadata.date} ${nextShowDoc.metadata.month}`
                            : new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const eventDay      = nextShowDoc?.metadata?.day  || '';
    const eventTime     = nextShowDoc?.metadata?.time?.split('\n')[0] || '8:00 PM';
    const eventLocation = nextShowDoc?.metadata?.location || 'The Studio, SG Highway';

    const venueParts    = eventLocation.split(',').map((s: string) => s.trim());
    const venueName     = venueParts[0]                || 'The Studio';
    const venueLocation = venueParts.slice(1).join(', ') || 'SG Highway';
    const fullEventDate = `${eventDate}${eventDay ? ', ' + eventDay : ''}`;

    // ── 7. Generate QR code ──────────────────────────────────────────────────
    const qrData: QRBookingData = {
      bookingId:       booking.bookingId,
      ticketNumber:    booking.bookingId,
      fullName:        booking.fullName,
      email:           booking.email,
      phone:           booking.phone || '',
      numberOfTickets: booking.numberOfTickets,
      bookingType:     booking.bookingType || 'paid',
      paymentId:       booking.paymentId   || '',
      paymentStatus:   booking.status      || 'confirmed',
      eventName:       eventTitle,
      eventDate:       fullEventDate,
      venue:           eventLocation,
      createdAt:       booking.createdAt,
    };

    const qrCodeDataUri = await generateSecureQRCode(qrData);

    // ── 8. Build HTML template ───────────────────────────────────────────────
    const templateData: TicketTemplateData = {
      ticketNumber:    `#${booking.bookingId}`,
      fullName:        booking.fullName,
      eventName:       eventTitle,
      eventDate:       fullEventDate,
      eventTime,
      venueName,
      venueLocation,
      seatType:        'General',
      bookingType:     booking.bookingType || 'paid',
      numberOfTickets: booking.numberOfTickets,
      qrCodeDataUri,
    };

    const htmlContent = generateTicketHtml(templateData);

    // ── 9. Launch / reuse browser ────────────────────────────────────────────
    let page;
    try {
      const browser = await getBrowser();
      page = await browser.newPage();
    } catch (launchErr) {
      // Browser may have crashed — reset and retry once
      console.warn('[generate-ticket] Browser error on newPage, resetting:', launchErr);
      if (_browser) { try { await _browser.close(); } catch {} _browser = null; }
      const browser = await getBrowser();
      page = await browser.newPage();
    }

    // ── 10. Render HTML → PDF ────────────────────────────────────────────────
    try {
      await page.setViewport({ width: 600, height: 1000 });

      // 'domcontentloaded' is enough because the template has ZERO external resources.
      // Do NOT use 'networkidle2' — it adds 500ms+ even with no network activity.
      await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded',
        timeout: 10_000,
      });

      // Measure actual rendered content height so the PDF is exactly one page,
      // no taller and no shorter. Using format:'A4' caused a black second page
      // because the ticket card is shorter than A4 — Puppeteer filled the gap
      // with the body background (#0A0A0A = black) and overflowed to page 2.
      const contentHeight = await page.evaluate(() => {
        return Math.ceil(document.documentElement.scrollHeight);
      });

      const pdfBuffer = await page.pdf({
        width:           '600px',
        height:          `${contentHeight + 1}px`, // +1px prevents hairline overflow
        printBackground: true,
        pageRanges:      '1',                       // safety net: only ever print page 1
        margin: { top: '0', bottom: '0', left: '0', right: '0' },
      });

      await page.close();

      // ── 11. Validate PDF output ──────────────────────────────────────────
      const nodeBuffer = Buffer.from(pdfBuffer);
      const magic      = nodeBuffer.slice(0, 4).toString('ascii');

      if (magic !== '%PDF') {
        console.error(
          `[generate-ticket] Invalid PDF output for ${bookingId}. ` +
          `Magic: "${magic}", Size: ${nodeBuffer.length} bytes`
        );
        return res.status(500).json({
          message: 'Ticket generation produced an invalid file. Please try again in a few seconds.',
        });
      }

      // ── 12. Cache the valid buffer ───────────────────────────────────────
      _pdfCache.set(bookingId, { buf: nodeBuffer, at: Date.now() });

      // ── 13. Send response ────────────────────────────────────────────────
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=HH-TICKET-${booking.bookingId}.pdf`);
      res.setHeader('Content-Length', nodeBuffer.length);
      res.setHeader('X-Cache', 'MISS');
      res.end(nodeBuffer);

    } catch (renderErr) {
      // Close the page even on error so it doesn't leak
      try { await page.close(); } catch {}
      throw renderErr;
    }

  } catch (err: any) {
    console.error('[generate-ticket] PDF generation failed:', err);
    return res.status(500).json({
      message: `Error: ${err.message}`,
      error: err.stack,
    });
  }
}
