/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import clientPromise from '../../../lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // BUG 6 FIX: Authenticate the caller and ensure email matches token
    const token = await getToken({ req });
    if (!token?.email) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { email } = req.query;

    // Only allow a user to see their own bookings
    if (!email || email !== token.email) {
      return res.status(403).json({ message: 'Forbidden: you can only view your own bookings' });
    }

    const client = await clientPromise;
    const db = client.db();

    const bookings = await db.collection('bookings')
      .find({ email: email as string })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ bookings });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}