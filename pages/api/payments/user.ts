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
    const token = await getToken({ req });
    if (!token?.email) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const client = await clientPromise;
    const db = client.db();

    // First get the user document to get the _id
    const user = await db.collection('users').findOne({ email: token.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Query payments using userId
    const payments = await db.collection('payments')
      .find({ userId: user._id.toString() })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ payments });
  } catch (error) {
    console.error('Fetch payments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 