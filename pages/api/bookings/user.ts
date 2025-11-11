/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const client = await clientPromise;
    const db = client.db();

    const bookings = await db.collection('bookings')
      .find({ email: email })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ bookings });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 