import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import clientPromise from '../../../../lib/mongodb';
import { withErrorHandler } from '../../../../lib/withErrorHandler';
import { generateDistributionChecklist } from './distribution-automation';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (session?.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const client = await clientPromise;
    const db = client.db();

    if (req.method === 'GET') {
      const events = await db.collection('events').find({}).sort({ showDate: 1 }).toArray();
      return res.status(200).json({ events });
    }

    if (req.method === 'POST') {
      const { name, showDate, venueName, capacity, artists } = req.body;

      if (!name || !showDate) {
        return res.status(400).json({ message: 'Event name and date are required' });
      }

      const event = {
        name,
        showDate: new Date(showDate),
        venueName: venueName || 'The Black Box',
        capacity: Number(capacity) || 150,
        artists: artists || [],
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('events').insertOne(event);
      
      // Automation: Create Distribution Workspace
      await generateDistributionChecklist(db, {
        eventId: result.insertedId.toString(),
        eventName: name,
        showDate: event.showDate,
        venueName: event.venueName,
        artists: event.artists
      });

      return res.status(201).json({ message: 'Event created successfully', eventId: result.insertedId });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Events API Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export default withErrorHandler(handler);
