/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';
import { generateBookingId } from '../../../lib/bookingId';

const VENUE_CAPACITY = 150;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      fullName,
      email,
      phone,
      numberOfTickets,
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !numberOfTickets) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate number of tickets
    if (numberOfTickets < 1 || numberOfTickets > 50) {
      return res.status(400).json({
        message: 'Number of tickets must be between 1 and 50'
      });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check capacity (warning only — admin may override)
    const totalBookings = await db.collection('bookings')
      .aggregate([
        {
          $match: {
            status: { $in: ['pending', 'approved'] },
          }
        },
        { $group: { _id: null, total: { $sum: '$numberOfTickets' } } }
      ])
      .toArray();

    const bookedSeats = totalBookings[0]?.total || 0;
    const capacityWarning = (bookedSeats + numberOfTickets) > VENUE_CAPACITY;

    // Generate human-friendly booking ID
    const bookingId = await generateBookingId();

    // Create guest booking
    const result = await db.collection('bookings').insertOne({
      bookingId,
      fullName,
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      numberOfTickets: Number(numberOfTickets),
      bookingType: 'paid',
      status: 'pending',
      attended: false,
      attendedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json({
      message: 'Booking created successfully',
      bookingId,
      _id: result.insertedId,
      capacityWarning,
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}