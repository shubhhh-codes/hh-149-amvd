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

const SECRET_KEY = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret-key-do-not-use-in-prod';

/**
 * Creates an HMAC SHA-256 signature for the given payload object.
 */
function createSignature(data: QRBookingData): string {
  const payloadString = JSON.stringify(data);
  return crypto.createHmac('sha256', SECRET_KEY).update(payloadString).digest('hex');
}

/**
 * Generates a signed QR code base64 data URI.
 */
export async function generateSecureQRCode(data: QRBookingData): Promise<string> {
  const signature = createSignature(data);
  const payload: SignedQRPayload = {
    data,
    signature,
  };

  const payloadString = JSON.stringify(payload, null, 2);

  try {
    // Generate QR code data URI
    const qrCodeDataUrl = await QRCode.toDataURL(payloadString, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 400, // Higher resolution for print
      color: {
        dark: '#000000', // Black QR
        light: '#FFFFFF', // White background
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating secure QR code:', error);
    throw new Error('Failed to generate secure QR code');
  }
}
