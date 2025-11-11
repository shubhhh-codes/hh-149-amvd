/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';
import clientPromise from '../../../lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = await getToken({ req });
    if (!token?.email) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { username, currentPassword, newPassword } = req.body;

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection('users').findOne({ 
      email: token.email 
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (username) {
      updateData.username = username;
    }

    if (currentPassword && newPassword) {
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    const result = await db.collection('users').updateOne(
      { email: token.email },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'No changes made' });
    }

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 