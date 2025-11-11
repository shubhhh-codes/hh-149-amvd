/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

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
      isComedianBooking,
      comedianId,
      eventDate,
      eventLocation,
      eventDuration 
    } = req.body;

    // Validate input
    if (!fullName || !email || !phone) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if user exists
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found. Please sign up first.' });
    }

    if (isComedianBooking) {
      // Validate comedian booking fields
      if (!comedianId || !eventDate || !eventLocation || !eventDuration) {
        return res.status(400).json({ message: 'Missing required fields for comedian booking' });
      }

      // Check if comedian exists and is approved
      const comedian = await db.collection('users').findOne({
        _id: new ObjectId(comedianId),
        isComedian: true,
        'comedianProfile.status': 'approved'
      });

      if (!comedian) {
        return res.status(400).json({ message: 'Comedian not found or not approved' });
      }

      // Create comedian booking
      const result = await db.collection('bookings').insertOne({
        userId: user._id.toString(),
        fullName,
        email,
        phone,
        isComedianBooking: true,
        comedianId,
        eventDate: new Date(eventDate),
        eventLocation,
        eventDuration: Number(eventDuration),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return res.status(201).json({ 
        message: 'Comedian booking created successfully', 
        bookingId: result.insertedId 
      });
    } else {
      // Regular show ticket booking
      if (!numberOfTickets) {
        return res.status(400).json({ message: 'Number of tickets is required' });
      }

      // Validate number of tickets
      if (numberOfTickets && (numberOfTickets < 1 || numberOfTickets > 50)) {
        return res.status(400).json({ 
          message: 'Number of tickets must be between 1 and 50' 
        });
      }

      // Check available seats
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
      
      if (bookedSeats + numberOfTickets > 50) {
        return res.status(400).json({ 
          message: 'Not enough seats available' 
        });
      }

      // Create show ticket booking
      const result = await db.collection('bookings').insertOne({
        userId: user._id.toString(),
        fullName,
        email,
        phone,
        numberOfTickets: Number(numberOfTickets),
        isComedianBooking: false,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return res.status(201).json({ 
        message: 'Show ticket booking created successfully', 
        bookingId: result.insertedId 
      });
    }
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 