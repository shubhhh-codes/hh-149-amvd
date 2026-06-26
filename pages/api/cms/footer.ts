import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

import { withErrorHandler } from '../../../lib/withErrorHandler';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const footerConfigArray = await db.collection('homepage_content')
      .find({ type: 'footer_settings' })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
      
    const footerConfig = footerConfigArray[0] || null;

    return res.status(200).json({ content: footerConfig });
  } catch (error) {
    console.error('Footer API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export default withErrorHandler(handler);
