/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import clientPromise from '../../../../lib/mongodb';
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

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid comedian ID' });
    }

    const client = await clientPromise;
    const db = client.db();

    if (req.method === 'PUT') {
      const { status } = req.body;
      
      if (!['pending', 'approved', 'declined'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const result = await db.collection('users').updateOne(
        { 
          _id: new ObjectId(id),
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
    console.error('Update comedian status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 