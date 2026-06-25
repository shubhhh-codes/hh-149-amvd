// lib/download-token.ts
import crypto from 'crypto';

const SECRET = process.env.NEXTAUTH_SECRET;

if (process.env.NODE_ENV === 'production' && !SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set in production');
}

const FINAL_SECRET = SECRET || 'fallback-secret-change-in-prod';

/**
 * Issues a short-lived signed download token.
 * Token encodes: bookingId, email (lowercased), expiry timestamp, HMAC signature.
 * Valid for 30 minutes. No database required.
 */
export function issueDownloadToken(bookingId: string, email: string): string {
  const exp = Date.now() + 30 * 60 * 1000; // 30 minutes from now
  const payload = `${bookingId}|${email.toLowerCase().trim()}|${exp}`;
  const sig = crypto.createHmac('sha256', FINAL_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}|${sig}`).toString('base64url');
}

/**
 * Verifies a download token against the expected bookingId.
 * Returns { valid: true } or { valid: false, reason: string }.
 */
export function verifyDownloadToken(
  token: string,
  expectedBookingId: string
): { valid: boolean; reason?: string } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split('|');

    if (parts.length !== 4) {
      return { valid: false, reason: 'malformed' };
    }

    const [bid, , expStr, sig] = parts;
    const exp = parseInt(expStr, 10);

    if (bid !== expectedBookingId) {
      return { valid: false, reason: 'bookingId mismatch' };
    }

    if (isNaN(exp) || Date.now() > exp) {
      return { valid: false, reason: 'expired' };
    }

    // Recompute signature and compare using timing-safe comparison
    const payload = `${parts[0]}|${parts[1]}|${parts[2]}`;
    const expected = crypto.createHmac('sha256', FINAL_SECRET).update(payload).digest('hex');

    const sigBuf      = Buffer.from(sig,      'hex');
    const expectedBuf = Buffer.from(expected, 'hex');

    if (sigBuf.length !== expectedBuf.length) {
      return { valid: false, reason: 'invalid signature' };
    }

    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return { valid: false, reason: 'invalid signature' };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'parse error' };
  }
}
