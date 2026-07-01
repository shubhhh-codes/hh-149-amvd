/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';
import { generateBookingId } from '../../../lib/bookingId';

import { withErrorHandler } from '../../../lib/withErrorHandler';

async function handler(
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
      cart,
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !numberOfTickets || !cart) {
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

    // Early Bird Expiration Check
    const hasEarlyBird = cart && Array.isArray(cart) && cart.some((item: any) => item.tierKey === 'early');
    if (hasEarlyBird) {
      const settings = await db.collection('settings').findOne({ type: 'ticket-tiers' });
      const earlyBird = settings?.earlyBird || { isActive: false, price: 119, maxBookings: 30, createdAt: new Date() };

      const earlyBirdBookings = await db.collection('bookings')
        .aggregate([
          { $match: { status: 'approved', 'cart.tierKey': 'early' } },
          { $unwind: '$cart' },
          { $match: { 'cart.tierKey': 'early' } },
          { $group: { _id: null, total: { $sum: '$cart.units' } } }
        ])
        .toArray();
      const earlyBirdSold = earlyBirdBookings[0]?.total || 0;

      const createdAtTime = earlyBird.createdAt ? new Date(earlyBird.createdAt).getTime() : 0;
      const isExpired = !earlyBird.isActive ||
                        (Date.now() - createdAtTime > 48 * 60 * 60 * 1000) ||
                        (earlyBirdSold >= (earlyBird.maxBookings ?? 30));

      if (isExpired) {
        return res.status(400).json({ message: 'The Early Bird offer has expired. Please select a Solo Pass.' });
      }
    }

    // Atomically increment booked seats to prevent race conditions
    const inventoryResult = await db.collection('inventory').findOneAndUpdate(
      { type: 'venue_capacity' },
      { $inc: { bookedSeats: numberOfTickets } },
      { upsert: true, returnDocument: 'after' }
    );

    const bookedSeats = inventoryResult?.bookedSeats || numberOfTickets;
    const VENUE_CAPACITY = inventoryResult?.maxCapacity || 150;
    const capacityWarning = bookedSeats > VENUE_CAPACITY;

    // Generate human-friendly booking ID
    const bookingId = await generateBookingId();

    // Create guest booking
    const result = await db.collection('bookings').insertOne({
      bookingId,
      fullName,
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      numberOfTickets: Number(numberOfTickets),
      cart: cart, // array of { tierKey, units, seats, price }
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
export default withErrorHandler(handler);
