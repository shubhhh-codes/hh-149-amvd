import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';
import { generateSecureQRCode, QRBookingData } from '../../lib/secure-qr';
import { generateTicketHtml, TicketTemplateData } from '../../lib/ticket-template';

let cachedBrowser: any = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { bookingId } = req.query;

  if (!bookingId || typeof bookingId !== 'string') {
    return res.status(400).json({ message: 'Booking ID is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // Look up the booking by human-friendly ID
    const booking = await db.collection('bookings').findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Fetch the current show data from CMS for dynamic event info
    const nextShowDoc = await db.collection('homepage_content').findOne({ type: 'next_show' });

    const eventTitle = nextShowDoc?.title || 'The Humours Hub: Open Mic Night';
    const eventDate = nextShowDoc?.metadata?.date && nextShowDoc?.metadata?.month
      ? `${nextShowDoc.metadata.date} ${nextShowDoc.metadata.month}`
      : new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const eventDay = nextShowDoc?.metadata?.day || '';
    const eventTime = nextShowDoc?.metadata?.time?.split('\n')[0] || '8:00 PM';
    const eventLocation = nextShowDoc?.metadata?.location || 'The Studio, SG Highway';
    const venueParts = eventLocation.split(',').map((s: string) => s.trim());
    const venueName = venueParts[0] || 'The Studio';
    const venueLocation = venueParts.slice(1).join(', ') || 'SG Highway';

    // Prepare dynamic data for QR Code
    const qrData: QRBookingData = {
      bookingId: booking.bookingId,
      ticketNumber: booking.bookingId,
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone || '',
      numberOfTickets: booking.numberOfTickets,
      bookingType: booking.bookingType || 'Paid',
      paymentId: booking.paymentId || '',
      paymentStatus: booking.status || 'Confirmed',
      eventName: eventTitle,
      eventDate: `${eventDate}${eventDay ? ', ' + eventDay : ''}`,
      venue: eventLocation,
      createdAt: booking.createdAt,
    };

    const qrCodeDataUri = await generateSecureQRCode(qrData);

    // Prepare dynamic data for Template
    const templateData: TicketTemplateData = {
      ticketNumber: `#${booking.bookingId}`,
      fullName: booking.fullName,
      eventName: eventTitle,
      eventDate: `${eventDate}${eventDay ? ', ' + eventDay : ''}`,
      eventTime,
      venueName,
      venueLocation,
      seatType: 'General',
      bookingType: booking.bookingType || 'Standard',
      qrCodeDataUri,
    };

    const htmlContent = generateTicketHtml(templateData);

    let browser;
    if (process.env.NODE_ENV === 'development') {
      if (!cachedBrowser) {
        const puppeteerModule = await import('puppeteer');
        const puppeteer = puppeteerModule.default || puppeteerModule;
        cachedBrowser = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
      }
      browser = cachedBrowser;
    } else {
      const puppeteerCoreModule = await import('puppeteer-core');
      const puppeteerCore = puppeteerCoreModule.default || puppeteerCoreModule;
      const chromiumModule = await import('@sparticuz/chromium');
      const chromium: any = chromiumModule.default || chromiumModule;
      
      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport || { width: 1920, height: 1080 },
        executablePath: await chromium.executablePath(),
        headless: chromium.headless === false ? false : true,
      });
    }

    const page = await browser.newPage();
    
    // Set viewport to simulate a mobile screen so the ticket looks like a mobile card
    await page.setViewport({ width: 600, height: 1000 });

    await page.setContent(htmlContent, {
      waitUntil: ['domcontentloaded', 'networkidle2'] as any,
      timeout: 15000,
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });

    await page.close();
    if (process.env.NODE_ENV !== 'development') {
      await browser.close();
    }

    // Puppeteer returns a Uint8Array, but Next.js res.send() serializes it as JSON.
    // We must convert to a proper Node.js Buffer and use res.end() for raw binary.
    const nodeBuffer = Buffer.from(pdfBuffer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=HH-TICKET-${booking.bookingId}.pdf`);
    res.setHeader('Content-Length', nodeBuffer.length);
    res.end(nodeBuffer);

  } catch (error) {
    console.error('Ticket generation error:', error);
    res.status(500).json({ message: 'Failed to generate ticket' });
  }
}
