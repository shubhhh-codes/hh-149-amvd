import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

import { withErrorHandler } from '../../../lib/withErrorHandler';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // Fetch profile page wrapper content
    const content = await db
      .collection('homepage_content')
      .findOne({ type: 'profile', isVisible: true });

    return res.status(200).json({
      success: true,
      content
    });
  } catch (error) {
    console.error('Failed to fetch profile content:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export default withErrorHandler(handler);
