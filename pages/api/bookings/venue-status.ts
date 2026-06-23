/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

const VENUE_CAPACITY = 150;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const totalBookings = await db.collection('bookings')
      .aggregate([
        {
          $match: {
            status: 'approved',
          }
        },
        { $group: { _id: null, total: { $sum: '$numberOfTickets' } } }
      ])
      .toArray();

    const totalApproved = totalBookings[0]?.total || 0;

    res.status(200).json({
      totalApproved,
      isFull: totalApproved >= VENUE_CAPACITY,
      remainingSeats: Math.max(0, VENUE_CAPACITY - totalApproved)
    });
  } catch (error) {
    console.error('Fetch venue status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
