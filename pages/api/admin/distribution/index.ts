import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import clientPromise from '../../../../lib/mongodb';
import { withErrorHandler } from '../../../../lib/withErrorHandler';
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (session?.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const client = await clientPromise;
    const db = client.db();

    if (req.method === 'GET') {
      const distributions = await db.collection('distributions').find({}).sort({ showDate: 1 }).toArray();
      return res.status(200).json({ distributions });
    }

    if (req.method === 'PUT') {
      const { id, checklist, generatedCopy, status } = req.body;
      
      if (!id) return res.status(400).json({ message: 'ID required' });

      const updateData: any = { updatedAt: new Date() };
      if (checklist) updateData.checklist = checklist;
      if (generatedCopy) updateData.generatedCopy = generatedCopy;
      if (status) updateData.status = status;

      await db.collection('distributions').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      return res.status(200).json({ message: 'Updated successfully' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ message: 'ID required' });

      // Find the distribution to get the eventId
      const distribution = await db.collection('distributions').findOne({ _id: new ObjectId(id as string) });
      
      if (distribution?.eventId) {
        // Delete the parent event as well
        await db.collection('events').deleteOne({ _id: new ObjectId(distribution.eventId) });
      }

      await db.collection('distributions').deleteOne({ _id: new ObjectId(id as string) });
      return res.status(200).json({ message: 'Deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Distribution API Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export default withErrorHandler(handler);
