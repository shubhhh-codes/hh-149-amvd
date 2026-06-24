import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const faqs = await db.collection('homepage_content')
      .find({ type: 'support_faq', isVisible: true, isDeleted: { $ne: true } })
      .sort({ displayOrder: 1 })
      .toArray();

    return res.status(200).json({ content: faqs });
  } catch (error) {
    console.error('FAQ API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
