import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';
import { withErrorHandler } from '../../../lib/withErrorHandler';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (session?.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const client = await clientPromise;
  const db = client.db();

  if (req.method === 'GET') {
    const doc = await db.collection('inventory').findOne({ type: 'venue_capacity' });
    return res.status(200).json({ maxCapacity: doc?.maxCapacity || 150 });
  }

  if (req.method === 'POST') {
    const { maxCapacity } = req.body;
    if (typeof maxCapacity !== 'number' || maxCapacity < 1) {
      return res.status(400).json({ message: 'Invalid capacity' });
    }

    await db.collection('inventory').updateOne(
      { type: 'venue_capacity' },
      { $set: { maxCapacity } },
      { upsert: true }
    );

    return res.status(200).json({ message: 'Capacity updated successfully', maxCapacity });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export default withErrorHandler(handler);
