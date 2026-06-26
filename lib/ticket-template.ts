/**
 * Ticket HTML template — fully self-contained, zero external CDN dependencies.
 * Uses system font stack so Puppeteer renders immediately without network calls.
 */

export interface TicketTemplateData {
  ticketNumber: string;       // e.g. "#HH-2026-000013"
  fullName: string;
  eventName: string;
  eventDate: string;          // e.g. "24 Jun, Tue"
  eventTime: string;          // e.g. "8:00 PM"
  venueName: string;          // e.g. "The Studio"
  venueLocation: string;      // e.g. "SG Highway, Ahmedabad"
  seatType: string;           // e.g. "General"
  bookingType: string;        // e.g. "paid" | "complimentary"
  numberOfTickets?: number;
  qrCodeDataUri: string;      // base64 PNG data URI
  tierName?: string;
  units?: number;
  price?: number;
}

export function generateTicketHtml(data: TicketTemplateData): string {
  const isComplimentary = data.bookingType?.toLowerCase() === 'complimentary';
  const badgeText  = isComplimentary ? 'COMPLIMENTARY' : 'CONFIRMED';
  const badgeColor = isComplimentary ? '#F59E0B' : '#FF6B1A';
  const badgeBg    = isComplimentary ? 'rgba(245,158,11,0.12)' : 'rgba(255,107,26,0.12)';
  const badgeBorder= isComplimentary ? 'rgba(245,158,11,0.3)' : 'rgba(255,107,26,0.3)';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Humours Hub — Ticket ${data.ticketNumber}</title>
<style>
  /* ── Reset ────────────────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Base ─────────────────────────────────────────────── */
  html, body {
    background: #0A0A0A;
    color: #E5E2E1;
    /* System font stack — zero network calls, renders instantly */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                 Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
  }

  /* ── Wrapper ──────────────────────────────────────────── */
  .wrap {
    width: 100%;
    max-width: 440px;
    margin: 0 auto;
  }

  /* ── Card ─────────────────────────────────────────────── */
  .card {
    background: #141414;
    border-radius: 24px;
    overflow: visible;
    box-shadow:
      0 0 0 1px rgba(255, 107, 26, 0.14),
      0 32px 64px rgba(0, 0, 0, 0.7);
    position: relative;
  }

  /* ── Stub (top) ───────────────────────────────────────── */
  .stub {
    background: #1C1C1C;
    border-radius: 24px 24px 0 0;
    padding: 28px 28px 32px;
    text-align: center;
    position: relative;
    border-bottom: 2px dashed rgba(255, 255, 255, 0.10);
  }

  /* Perforation circles */
  .stub::before,
  .stub::after {
    content: '';
    position: absolute;
    bottom: -16px;
    width: 30px;
    height: 30px;
    background: #0A0A0A;
    border-radius: 50%;
    z-index: 2;
  }
  .stub::before { left: -15px; }
  .stub::after  { right: -15px; }

  .stub-eyebrow {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #555;
    margin-bottom: 10px;
  }

  .stub-id {
    font-size: 30px;
    font-weight: 900;
    letter-spacing: 0.04em;
    color: #FF6B1A;
    line-height: 1;
    margin-bottom: 12px;
  }

  .stub-badge {
    display: inline-block;
    padding: 4px 14px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    background: ${badgeBg};
    color: ${badgeColor};
    border: 1px solid ${badgeBorder};
  }

  /* ── Body ─────────────────────────────────────────────── */
  .body {
    padding: 36px 28px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .event-name {
    font-size: 24px;
    font-weight: 900;
    line-height: 1.2;
    color: #FFFFFF;
    letter-spacing: -0.02em;
    margin-bottom: 8px;
  }

  .admitting {
    font-size: 13px;
    color: #666;
    margin-bottom: 28px;
    letter-spacing: 0.01em;
  }
  .admitting strong {
    color: #E5E2E1;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* ── Info Grid ────────────────────────────────────────── */
  .grid {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  .cell {
    padding: 16px 18px;
    text-align: left;
  }
  .cell:first-child {
    border-right: 1px solid rgba(255, 255, 255, 0.06);
  }

  .cell-label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.20em;
    text-transform: uppercase;
    color: #444;
    margin-bottom: 5px;
  }
  .cell-value {
    font-size: 17px;
    font-weight: 800;
    color: #FFFFFF;
    line-height: 1.15;
  }
  .cell-sub {
    font-size: 12px;
    color: #666;
    margin-top: 3px;
    font-weight: 400;
  }

  /* ── Ticket Count Pill ────────────────────────────────── */
  .count-pill {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 18px;
    background: rgba(255, 107, 26, 0.06);
    border: 1px solid rgba(255, 107, 26, 0.14);
    border-radius: 10px;
    margin-bottom: 24px;
  }
  .count-pill-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #555;
  }
  .count-pill-value {
    font-size: 18px;
    font-weight: 900;
    color: #FF6B1A;
    letter-spacing: -0.01em;
  }

  /* ── QR ───────────────────────────────────────────────── */
  .qr-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 14px;
  }
  .qr-halo {
    position: absolute;
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, rgba(255, 107, 26, 0.20) 0%, transparent 72%);
    border-radius: 50%;
    pointer-events: none;
  }
  .qr-box {
    position: relative;
    z-index: 1;
    background: #FFFFFF;
    padding: 10px;
    border-radius: 16px;
    box-shadow: 0 0 48px rgba(255, 107, 26, 0.10);
  }
  .qr-box img {
    display: block;
    width: 132px;
    height: 132px;
  }
  .qr-hint {
    font-size: 11px;
    color: #444;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* ── Footer ───────────────────────────────────────────── */
  .foot {
    background: #0F0F0F;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 0 0 24px 24px;
    padding: 13px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .foot-brand {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #FF6B1A;
  }
  .foot-type {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #333;
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">

    <!-- Top Stub -->
    <div class="stub">
      <p class="stub-eyebrow">Digital Ticket</p>
      <p class="stub-id">${data.ticketNumber}</p>
      <span class="stub-badge">${badgeText}</span>
    </div>

    <!-- Body -->
    <div class="body">

      <h1 class="event-name">${data.eventName}</h1>
      <p class="admitting">Admitting &nbsp;<strong>${data.fullName}</strong></p>

      <!-- Date / Venue Grid -->
      <div class="grid">
        <div class="cell">
          <p class="cell-label">Date</p>
          <p class="cell-value">${data.eventDate}</p>
          <p class="cell-sub">${data.eventTime}</p>
        </div>
        <div class="cell">
          <p class="cell-label">Venue</p>
          <p class="cell-value">${data.venueName}</p>
          <p class="cell-sub">${data.venueLocation}</p>
        </div>
      </div>

      <!-- Order Details Grid -->
      <div class="grid" style="margin-bottom: 24px;">
        <div class="cell">
          <p class="cell-label">Pass / Type</p>
          <p class="cell-value">${data.tierName || data.seatType}</p>
          <p class="cell-sub">${data.units ? `${data.units} Passes (${data.numberOfTickets} Seats)` : `${data.numberOfTickets} Seats`}</p>
        </div>
        <div class="cell">
          <p class="cell-label">Amount Paid</p>
          <p class="cell-value">${data.price ? `₹${data.price}` : (isComplimentary ? 'FREE' : 'N/A')}</p>
          <p class="cell-sub">${data.bookingType.toUpperCase()} via Razorpay</p>
        </div>
      </div>

      <!-- QR Code -->
      <div class="qr-wrap">
        <div class="qr-halo"></div>
        <div class="qr-box">
          <img src="${data.qrCodeDataUri}" alt="Ticket QR Code" width="132" height="132"/>
        </div>
      </div>
      <p class="qr-hint">Scan at the entrance</p>

    </div>

    <!-- Footer -->
    <div class="foot">
      <span class="foot-brand">Humours Hub</span>
      <span class="foot-type">${data.seatType} Admission</span>
    </div>

  </div>
</div>
</body>
</html>`;
}
