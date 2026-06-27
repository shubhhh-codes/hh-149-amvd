/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import clientPromise from '../../../../lib/mongodb';

import { sendCheckInNotification } from '../../../../lib/discord';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { bookingId, checkInQuantity } = req.body;

    if (!bookingId || typeof checkInQuantity !== 'number' || checkInQuantity <= 0) {
      return res.status(400).json({ message: 'Invalid bookingId or checkInQuantity' });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const booking = await db.collection('bookings').findOne({ bookingId });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ message: `Booking is ${booking.status}` });
    }

    const currentCheckedIn = booking.checkedInCount || 0;
    const totalTickets = booking.numberOfTickets;
    
    // Fast-fail if obviously over capacity before hitting DB again
    if (currentCheckedIn + checkInQuantity > totalTickets) {
      return res.status(400).json({ 
        message: `Cannot check in ${checkInQuantity} people. Only ${totalTickets - currentCheckedIn} seats remaining.` 
      });
    }

    // Atomic update using an aggregation pipeline to strictly verify capacity and update conditionally
    const result = await db.collection('bookings').findOneAndUpdate(
      { 
        bookingId,
        $expr: { 
          $gte: [ 
            "$numberOfTickets", 
            { $add: [ { $ifNull: ["$checkedInCount", 0] }, checkInQuantity ] } 
          ] 
        }
      },
      [
        {
          $set: {
            checkedInCount: { $add: [ { $ifNull: ["$checkedInCount", 0] }, checkInQuantity ] },
            updatedAt: "$$NOW"
          }
        },
        {
          $set: {
            attended: { $eq: [ "$checkedInCount", "$numberOfTickets" ] },
            attendedAt: { 
              $cond: { 
                if: { $eq: [ "$checkedInCount", "$numberOfTickets" ] }, 
                then: { $ifNull: ["$attendedAt", "$$NOW"] }, 
                else: "$attendedAt" 
              } 
            }
          }
        }
      ],
      { returnDocument: 'after' }
    );

    // MongoDB Node Driver v6 returns the doc directly, v4 wrapped it in `{ value }`. Handle both safely.
    const updatedBooking = result?.value !== undefined ? result.value : result;

    if (!updatedBooking) {
      // The atomic update failed, meaning a concurrent request just took the tickets.
      // Re-fetch to get the exact new remaining count for the error message.
      const latestBooking = await db.collection('bookings').findOne({ bookingId });
      const latestCheckedIn = latestBooking?.checkedInCount || 0;
      const remaining = totalTickets - latestCheckedIn;
      return res.status(400).json({ 
        message: `Cannot check in ${checkInQuantity} people. Only ${remaining} seats remaining.` 
      });
    }

    // Fire webhook notification asynchronously
    sendCheckInNotification({
      bookingId: booking.bookingId,
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone,
      checkInQuantity,
      totalCheckedIn: updatedBooking.checkedInCount,
      totalTickets,
      bookingType: booking.bookingType
    }).catch(console.error);

    return res.status(200).json({
      message: `Successfully checked in ${checkInQuantity} people`,
      checkedInCount: updatedBooking.checkedInCount,
      attended: updatedBooking.attended
    });

  } catch (error) {
    console.error('Check-in API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
