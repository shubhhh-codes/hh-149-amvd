import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const footerConfig = await db.collection('homepage_content')
      .findOne({ type: 'footer_settings' });

    return res.status(200).json({ content: footerConfig });
  } catch (error) {
    console.error('Footer API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
