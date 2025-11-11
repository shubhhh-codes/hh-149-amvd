/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

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

    if (req.method === 'GET') {
      const bookings = await db.collection('bookings')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({ bookings });
    }

    if (req.method === 'PUT') {
      try {
        const { bookingId, status } = req.body;

        if (!bookingId || !status) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        // Get the booking details
        const booking = await db.collection('bookings').findOne({ 
          _id: new ObjectId(bookingId)
        });

        if (!booking) {
          return res.status(404).json({ message: 'Booking not found' });
        }

        // If approving a booking, check seat availability
        if (status === 'approved' && !booking.isComedianBooking) {
          // Get total approved seats
          const totalBookings = await db.collection('bookings')
            .aggregate([
              { 
                $match: { 
                  status: 'approved',
                  isComedianBooking: { $ne: true }
                } 
              },
              { $group: { _id: null, total: { $sum: '$numberOfTickets' } } }
            ])
            .toArray();

          const bookedSeats = totalBookings[0]?.total || 0;

          // Check if approving this booking would exceed capacity
          if (bookedSeats + booking.numberOfTickets > 50) {
            return res.status(400).json({ 
              message: 'Cannot approve booking - would exceed venue capacity' 
            });
          }
        }

        // Update the booking status
        const result = await db.collection('bookings').updateOne(
          { _id: new ObjectId(bookingId) },
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

        res.status(200).json({ message: 'Booking status updated successfully' });
      } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Admin bookings API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 