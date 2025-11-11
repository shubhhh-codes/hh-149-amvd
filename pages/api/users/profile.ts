/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const client = await clientPromise;
    const db = client.db();

    if (req.method === 'GET') {
      const { email } = req.query;
      
      if (email !== session.user.email) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const user = await db.collection('users').findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ user });
    }

    if (req.method === 'PUT') {
      const { email, username, phone, bio } = req.body;

      if (email !== session.user.email) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const result = await db.collection('users').updateOne(
        { email },
        { 
          $set: { 
            username,
            phone,
            bio,
            updatedAt: new Date()
          } 
        }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ message: 'Profile updated successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Profile API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 