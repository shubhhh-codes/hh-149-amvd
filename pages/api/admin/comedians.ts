/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */
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
    
    if (!session?.user?.email || session.user.email !== 'admin@humorshub.com') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const client = await clientPromise;
    const db = client.db();

    if (req.method === 'GET') {
      const comedians = await db.collection('users')
        .find({
          isComedian: true,
          comedianProfile: { $exists: true }
        })
        .project({
          _id: 1,
          username: 1,
          email: 1,
          phone: 1,
          createdAt: 1,
          comedianProfile: 1
        })
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({ comedians });
    }

    if (req.method === 'PUT') {
      const { comedianId, status } = req.body;

      if (!comedianId || !status || !['pending', 'approved', 'declined'].includes(status)) {
        return res.status(400).json({ message: 'Invalid request data' });
      }

      const result = await db.collection('users').updateOne(
        { 
          _id: new ObjectId(comedianId),
          isComedian: true 
        },
        { 
          $set: { 
            'comedianProfile.status': status,
            updatedAt: new Date()
          } 
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Comedian not found' });
      }

      if (result.modifiedCount === 0) {
        return res.status(400).json({ message: 'Status update failed' });
      }

      return res.status(200).json({ message: 'Comedian status updated successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Admin comedians API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 