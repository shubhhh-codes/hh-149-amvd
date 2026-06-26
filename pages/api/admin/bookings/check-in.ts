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
    
    const newCheckedInCount = currentCheckedIn + checkInQuantity;
    
    if (newCheckedInCount > totalTickets) {
      return res.status(400).json({ 
        message: `Cannot check in ${checkInQuantity} people. Only ${totalTickets - currentCheckedIn} seats remaining.` 
      });
    }

    const isFullyAttended = newCheckedInCount === totalTickets;

    const result = await db.collection('bookings').updateOne(
      { bookingId },
      { 
        $set: { 
          checkedInCount: newCheckedInCount,
          attended: isFullyAttended,
          updatedAt: new Date(),
          ...(isFullyAttended ? { attendedAt: new Date() } : {})
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'Failed to update attendance' });
    }

    // Fire webhook notification asynchronously
    sendCheckInNotification({
      bookingId: booking.bookingId,
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone,
      checkInQuantity,
      totalCheckedIn: newCheckedInCount,
      totalTickets,
      bookingType: booking.bookingType
    }).catch(console.error);

    return res.status(200).json({
      message: `Successfully checked in ${checkInQuantity} people`,
      checkedInCount: newCheckedInCount,
      attended: isFullyAttended
    });

  } catch (error) {
    console.error('Check-in API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
