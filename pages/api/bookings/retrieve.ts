import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';
import { issueDownloadToken } from '../../../lib/download-token';
import { rateLimit } from '../../../lib/rate-limit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Rate limit: 10 searches per minute per IP
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unknown';

  if (!rateLimit(ip, 10, 60_000)) {
    return res.status(429).json({ message: 'Too many requests. Please wait a moment.' });
  }

  try {
    const { email, phone, bookingId } = req.body;

    if (
      (email !== undefined && typeof email !== 'string') ||
      (phone !== undefined && typeof phone !== 'string') ||
      (bookingId !== undefined && typeof bookingId !== 'string')
    ) {
      return res.status(400).json({ message: 'Invalid parameter types' });
    }

    // ── Build phone query ────────────────────────────────────────────────────
    let phoneQuery: any;
    if (phone) {
      const digits = phone.replace(/\D/g, '');
      if (digits.length >= 10) {
        const last10 = digits.slice(-10);
        phoneQuery = { $regex: last10 + '$' }; // suffix match handles +91 prefix variants
      } else {
        phoneQuery = phone.trim();
      }
    }

    // ── Build MongoDB query ──────────────────────────────────────────────────
    let query: any = {};

    if (bookingId) {
      // Booking ID mode: must also provide at least one contact
      if (!email && !phone) {
        return res.status(400).json({
          message: 'Email or phone number is required along with Booking ID',
        });
      }
      query.bookingId = bookingId.trim();
      const orConditions: any[] = [];
      if (email) orConditions.push({ email: email.toLowerCase().trim() });
      if (phone) orConditions.push({ phone: phoneQuery });
      query.$or = orConditions;
    } else {
      // Email + Phone mode: both required
      if (!email || !phone) {
        return res.status(400).json({ message: 'Both Email and Phone are required' });
      }
      query.email = email.toLowerCase().trim();
      query.phone = phoneQuery;
    }

    const client = await clientPromise;
    const db     = client.db();

    const bookings = await db
      .collection('bookings')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // ── Resolve the verified email for token issuance ────────────────────────
    // Use the email from the request (which has been verified by the MongoDB query).
    // Falls back to the booking's stored email.
    const verifiedEmail = email?.toLowerCase().trim() || bookings[0]?.email || '';

    // ── Separate by status ───────────────────────────────────────────────────
    const activeBookings    = bookings.filter(b => b.status === 'approved');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
    const pendingBookings   = bookings.filter(b => b.status === 'pending');

    return res.status(200).json({
      activeBookings: activeBookings.map(b => ({
        bookingId:       b.bookingId,
        fullName:        b.fullName,
        numberOfTickets: b.numberOfTickets,
        status:          b.status,
        bookingType:     b.bookingType,
        createdAt:       b.createdAt,
        // Short-lived signed token proving this user proved identity via retrieve
        downloadToken: issueDownloadToken(b.bookingId, verifiedEmail),
      })),
      cancelledBookings: cancelledBookings.map(b => ({
        bookingId:       b.bookingId,
        fullName:        b.fullName,
        numberOfTickets: b.numberOfTickets,
        status:          b.status,
        bookingType:     b.bookingType,
        createdAt:       b.createdAt,
      })),
      // Show pending so users know their payment is still processing
      pendingBookings: pendingBookings.map(b => ({
        bookingId:       b.bookingId,
        fullName:        b.fullName,
        numberOfTickets: b.numberOfTickets,
        status:          b.status,
        createdAt:       b.createdAt,
      })),
      total: bookings.length,
    });

  } catch (error) {
    console.error('[retrieve] Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
