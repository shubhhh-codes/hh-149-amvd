/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = await getToken({ req });
    if (!token?.email) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const bookingId = req.query.id as string;
    const client = await clientPromise;
    const db = client.db();

    // Verify booking belongs to user
    const booking = await db.collection('bookings').findOne({
      _id: new ObjectId(bookingId),
      email: token.email
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending bookings' });
    }

    await db.collection('bookings').deleteOne({
      _id: new ObjectId(bookingId)
    });

    res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 