import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (session?.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const client = await clientPromise;
    const db = client.db();

    if (req.method === 'GET') {
      const feedbacks = await db.collection('feedbacks')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({ feedbacks });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Admin feedbacks API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
