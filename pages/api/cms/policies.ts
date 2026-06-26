import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

import { withErrorHandler } from '../../../lib/withErrorHandler';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('humourshub');

    // Fetch all policies
    const policies = await db
      .collection('homepage_content')
      .find({ type: 'policy', isVisible: true })
      .sort({ displayOrder: 1 })
      .toArray();

    return res.status(200).json({
      success: true,
      policies
    });
  } catch (error) {
    console.error('Failed to fetch policies:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export default withErrorHandler(handler);
