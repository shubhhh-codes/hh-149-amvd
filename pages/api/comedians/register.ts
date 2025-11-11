/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import clientPromise from '../../../lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = await getToken({ req });
    if (!token?.email) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const {
      username,
      email,
      phone,
      isComedian,
      comedianProfile
    } = req.body;

    // Validate input
    if (!username || !email || !phone || !comedianProfile) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email });
    
    if (existingUser) {
      // Update existing user
      const result = await db.collection('users').updateOne(
        { email },
        {
          $set: {
            username,
            phone,
            isComedian,
            comedianProfile,
            updatedAt: new Date()
          }
        }
      );

      if (result.modifiedCount === 0) {
        return res.status(400).json({ message: 'No changes made' });
      }
    } else {
      // Create new user
      await db.collection('users').insertOne({
        username,
        email,
        phone,
        isComedian,
        comedianProfile,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    res.status(200).json({ message: 'Comedian registration successful' });
  } catch (error) {
    console.error('Comedian registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 