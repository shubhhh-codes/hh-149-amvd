import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const client = await clientPromise;
    const db = client.db();

    // Fetch shows content types
    const content = await db.collection('homepage_content')
      .find({ 
        type: { $in: ['shows_hero', 'next_show', 'past_shows'] }, 
        isVisible: true, 
        isDeleted: { $ne: true } 
      })
      .sort({ displayOrder: 1, createdAt: -1 })
      .toArray();

    // Group them for easy frontend consumption
    const showsData = {
      hero: content.find(c => c.type === 'shows_hero') || null,
      nextShow: content.find(c => c.type === 'next_show') || null,
      pastShows: content.filter(c => c.type === 'past_shows')
    };

    return res.status(200).json(showsData);
  } catch (error) {
    console.error('Public CMS API error (shows):', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
