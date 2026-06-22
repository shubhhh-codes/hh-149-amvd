import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const client = await clientPromise;
    const db = client.db();

    // Fetch only visible gallery items that are not deleted
    const content = await db.collection('homepage_content')
      .find({ type: 'gallery', isVisible: true, isDeleted: { $ne: true } })
      .sort({ displayOrder: 1, createdAt: -1 })
      .toArray();

    return res.status(200).json({ content });
  } catch (error) {
    console.error('Public CMS API error (gallery):', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
