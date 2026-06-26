/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import clientPromise from '../../../../lib/mongodb';
import crypto from 'crypto';

const SECRET_KEY_ENV = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
const SECRET_KEY = SECRET_KEY_ENV || 'fallback-secret-key-do-not-use-in-prod';

function verifySignature(compactData: any, signature: string): boolean {
  const payloadString = JSON.stringify(compactData);
  const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(payloadString).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { qrData } = req.body;
    if (!qrData) {
      return res.status(400).json({ message: 'Missing QR data' });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(qrData);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid QR format' });
    }

    const { bid, n, ts, sig } = parsed;
    
    if (!bid || !sig) {
      return res.status(400).json({ message: 'Invalid or missing QR payload data' });
    }

    const compactData = { bid, n, ts };
    if (!verifySignature(compactData, sig)) {
      return res.status(403).json({ message: 'Invalid QR Signature - Ticket might be forged!' });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const booking = await db.collection('bookings').findOne({ bookingId: bid });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ 
        message: `Booking is ${booking.status.toUpperCase()}`,
        booking 
      });
    }

    return res.status(200).json({
      message: 'Valid Ticket',
      bookingId: booking.bookingId,
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone,
      bookingType: booking.bookingType,
      numberOfTickets: booking.numberOfTickets,
      checkedInCount: booking.checkedInCount || 0,
      cart: booking.cart || [],
      amountPaid: booking.amountPaid || 0,
      attended: booking.attended || false
    });

  } catch (error) {
    console.error('Scan API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
