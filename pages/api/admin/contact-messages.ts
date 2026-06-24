import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (session?.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const client = await clientPromise;
    const db = client.db();

    // GET — List all messages
    if (req.method === 'GET') {
      const messages = await db.collection('contact_messages')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({ messages });
    }

    // PATCH — Update message status (e.g. mark as read)
    if (req.method === 'PATCH') {
      const { messageId, status } = req.body;

      if (!messageId || !status) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const result = await db.collection('contact_messages').updateOne(
        { _id: new ObjectId(messageId) },
        {
          $set: {
            status,
            updatedAt: new Date()
          }
        }
      );

      if (result.modifiedCount === 0) {
        return res.status(400).json({ message: 'Failed to update message status' });
      }

      return res.status(200).json({ message: 'Message status updated successfully' });
    }

    // DELETE — Delete a message
    if (req.method === 'DELETE') {
      const { messageId } = req.query;

      if (!messageId || typeof messageId !== 'string') {
        return res.status(400).json({ message: 'Missing messageId parameter' });
      }

      const result = await db.collection('contact_messages').deleteOne({
        _id: new ObjectId(messageId)
      });

      if (result.deletedCount === 0) {
        return res.status(400).json({ message: 'Failed to delete message' });
      }

      return res.status(200).json({ message: 'Message deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Admin contact messages API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
