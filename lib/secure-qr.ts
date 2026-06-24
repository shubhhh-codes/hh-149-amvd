import QRCode from 'qrcode';
import crypto from 'crypto';

export interface QRBookingData {
  bookingId: string;
  ticketNumber: string;
  fullName: string;
  email: string;
  phone?: string;
  numberOfTickets: number;
  bookingType?: string;
  paymentId?: string;
  paymentStatus?: string;
  eventId?: string;
  eventName: string;
  eventDate: string;
  venue: string;
  createdAt: string;
}

export interface SignedQRPayload {
  data: QRBookingData;
  signature: string;
}

const SECRET_KEY =
  process.env.NEXTAUTH_SECRET ||
  process.env.JWT_SECRET ||
  'fallback-secret-key-do-not-use-in-prod';

function createSignature(data: object): string {
  // Use compact JSON for the signature input to match the payload encoding
  const payloadString = JSON.stringify(data);
  return crypto.createHmac('sha256', SECRET_KEY).update(payloadString).digest('hex');
}

/**
 * Generates a compact, signed QR code base64 data URI.
 *
 * Payload is minimal (no PII) — only bookingId, ticket count, timestamp, and HMAC sig.
 * Venue staff scan → look up full booking via bookingId server-side.
 *
 * Result is ~80 bytes vs the previous ~650 bytes (pretty-printed full PII).
 * This makes the QR code significantly less dense and easier to scan.
 */
export async function generateSecureQRCode(data: QRBookingData): Promise<string> {
  // Compact payload — no email, no phone, no payment details
  const compact = {
    bid: data.bookingId,
    n:   data.numberOfTickets,
    ts:  Math.floor(Date.now() / 1000), // Unix timestamp for venue expiry checks
  };

  const sig = createSignature(compact);

  // Compact JSON — no whitespace
  const payloadString = JSON.stringify({ ...compact, sig });

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(payloadString, {
      errorCorrectionLevel: 'L', // Low correction — payload is short, less density needed
      margin: 1,
      width: 280,                // Was 400 — smaller is fine with L-level correction
      color: {
        dark:  '#000000',
        light: '#FFFFFF',
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('[secure-qr] Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}
