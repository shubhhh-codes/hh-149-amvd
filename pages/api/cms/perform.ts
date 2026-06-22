import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const client = await clientPromise;
    const db = client.db();

    // Fetch perform hero content
    const content = await db.collection('homepage_content')
      .findOne({ type: 'perform_hero', isVisible: true, isDeleted: { $ne: true } });

    return res.status(200).json({ content });
  } catch (error) {
    console.error('Public CMS API error (perform):', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
