import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, phone, bookingId } = req.body;

    let query: any = {};

    let phoneQuery: any;
    if (phone) {
      const digits = phone.replace(/\D/g, '');
      if (digits.length >= 10) {
        const last10 = digits.slice(-10);
        phoneQuery = { $regex: last10 + '$' };
      } else {
        phoneQuery = phone.trim();
      }
    }

    if (bookingId) {
      if (!email && !phone) {
        return res.status(400).json({ message: 'Email or phone number is required along with Booking ID' });
      }
      query.bookingId = bookingId.trim();
      const orConditions = [];
      if (email) orConditions.push({ email: email.toLowerCase().trim() });
      if (phone) orConditions.push({ phone: phoneQuery });
      query.$or = orConditions;
    } else {
      if (!email || !phone) {
        return res.status(400).json({ message: 'Both Email and Phone are required' });
      }
      query.email = email.toLowerCase().trim();
      query.phone = phoneQuery;
    }

    const client = await clientPromise;
    const db = client.db();

    const bookings = await db.collection('bookings')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Separate active and cancelled bookings
    const activeBookings = bookings.filter(b => b.status !== 'cancelled');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

    return res.status(200).json({
      activeBookings: activeBookings.map(b => ({
        bookingId: b.bookingId,
        fullName: b.fullName,
        numberOfTickets: b.numberOfTickets,
        status: b.status,
        bookingType: b.bookingType,
        createdAt: b.createdAt,
      })),
      cancelledBookings: cancelledBookings.map(b => ({
        bookingId: b.bookingId,
        fullName: b.fullName,
        numberOfTickets: b.numberOfTickets,
        status: b.status,
        bookingType: b.bookingType,
        createdAt: b.createdAt,
      })),
      total: bookings.length,
    });
  } catch (error) {
    console.error('Retrieve bookings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
