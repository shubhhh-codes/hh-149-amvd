/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';
import { generateBookingId } from '../../../lib/bookingId';

const VENUE_CAPACITY = 150;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email || session.user.email !== 'admin@humorshub.com') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const client = await clientPromise;
    const db = client.db();

    // GET — List all bookings
    if (req.method === 'GET') {
      const bookings = await db.collection('bookings')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({ bookings });
    }

    // POST — Create complimentary booking
    if (req.method === 'POST') {
      const { fullName, email, phone, numberOfTickets } = req.body;

      if (!fullName || !email || !phone || !numberOfTickets) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const bookingId = await generateBookingId();

      await db.collection('bookings').insertOne({
        bookingId,
        fullName,
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        numberOfTickets: Number(numberOfTickets),
        bookingType: 'complimentary',
        status: 'approved',
        attended: false,
        attendedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return res.status(201).json({ message: 'Complimentary booking created', bookingId });
    }

    // PUT — Update booking status (approve/cancel)
    if (req.method === 'PUT') {
      const { bookingId, status } = req.body;

      if (!bookingId || !status) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const booking = await db.collection('bookings').findOne({ bookingId });

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // If approving, check capacity (warning only)
      if (status === 'approved') {
        const totalBookings = await db.collection('bookings')
          .aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$numberOfTickets' } } }
          ])
          .toArray();

        const bookedSeats = totalBookings[0]?.total || 0;

        if (bookedSeats + booking.numberOfTickets > VENUE_CAPACITY) {
          // Warning only — admin can still override
          console.warn('Capacity warning: approving would exceed venue capacity');
        }
      }

      const result = await db.collection('bookings').updateOne(
        { bookingId },
        {
          $set: {
            status,
            updatedAt: new Date()
          }
        }
      );

      if (result.modifiedCount === 0) {
        return res.status(400).json({ message: 'Failed to update booking status' });
      }

      return res.status(200).json({ message: 'Booking status updated successfully' });
    }

    // PATCH — Toggle attendance
    if (req.method === 'PATCH') {
      const { bookingId, attended } = req.body;

      if (!bookingId || typeof attended !== 'boolean') {
        return res.status(400).json({ message: 'Missing bookingId or attended field' });
      }

      const updateFields: any = {
        attended,
        updatedAt: new Date(),
      };

      if (attended) {
        updateFields.attendedAt = new Date();
      } else {
        updateFields.attendedAt = null;
      }

      const result = await db.collection('bookings').updateOne(
        { bookingId },
        { $set: updateFields }
      );

      if (result.modifiedCount === 0) {
        return res.status(400).json({ message: 'Failed to update attendance' });
      }

      return res.status(200).json({ message: 'Attendance updated successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Admin bookings API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}