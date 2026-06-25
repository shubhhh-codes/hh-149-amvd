import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../../lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const client = await clientPromise;
    const db = client.db();

    if (req.method === 'GET') {
      const settings = await db.collection('settings').findOne({ type: 'ticket-tiers' });
      
      let tiers = settings?.tiers || [
        { key: 'solo', name: 'Solo Pass', label: 'SOLO', price: 499, seats: 1, badge: null, displayOrder: 1 },
        { key: 'duo', name: 'Duo Pass', label: 'DUO', price: 899, seats: 2, badge: 'MOST POPULAR', displayOrder: 2 },
        { key: 'squad', name: 'Squad Pass', label: 'SQUAD', price: 1599, seats: 4, badge: null, displayOrder: 3 },
      ];

      return res.status(200).json({ 
        tiers,
        venue: settings?.venue || 'The Humours Hub, Ahmedabad',
        date: settings?.date || 'Saturday',
        time: settings?.time || '8:30 PM'
      });
    }

    if (req.method === 'POST') {
      const { tiers, venue, date, time } = req.body;
      
      if (!Array.isArray(tiers)) {
        return res.status(400).json({ message: 'Invalid tiers data' });
      }

      await db.collection('settings').updateOne(
        { type: 'ticket-tiers' },
        { $set: { tiers, venue, date, time, updatedAt: new Date() } },
        { upsert: true }
      );

      return res.status(200).json({ message: 'Ticket tiers updated successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling ticket tiers:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
