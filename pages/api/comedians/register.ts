/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      username,
      email,
      phone,
      comedianProfile
    } = req.body;

    // Validate input
    if (!username || !email || !phone || !comedianProfile) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Always force status to 'pending' — never trust client-supplied status
    const sanitizedProfile = {
      ...comedianProfile,
      status: 'pending',
    };

    const client = await clientPromise;
    const db = client.db();

    // Check if a comedian application already exists for this email
    const existingApp = await db.collection('users').findOne({
      email,
      isComedian: true,
    });

    if (existingApp) {
      return res.status(400).json({ message: 'A comedian application already exists for this email' });
    }

    // Upsert: update existing user doc or create a new one for comedian application
    const result = await db.collection('users').updateOne(
      { email },
      {
        $set: {
          username,
          phone,
          isComedian: true,
          comedianProfile: sanitizedProfile,
          updatedAt: new Date()
        },
        $setOnInsert: {
          email,
          role: 'comedian',
          createdAt: new Date(),
        }
      },
      { upsert: true }
    );

    res.status(200).json({ message: 'Comedian application submitted successfully' });
  } catch (error) {
    console.error('Comedian registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}