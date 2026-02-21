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
      comedianProfile
    } = req.body;

    // Validate input
    if (!username || !email || !phone || !comedianProfile) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Security: ensure the comedian is registering for their own account
    if (email !== token.email) {
      return res.status(403).json({ message: 'Forbidden: you can only register yourself as a comedian' });
    }

    // BUG 8 FIX: Always force status to 'pending' on the server — never trust
    // client-supplied status. This prevents self-approval bypass.
    const sanitizedProfile = {
      ...comedianProfile,
      status: 'pending',
    };

    const client = await clientPromise;
    const db = client.db();

    // User must already have an account — no password-less account creation
    const existingUser = await db.collection('users').findOne({ email });

    if (!existingUser) {
      return res.status(400).json({ message: 'User must have an account before registering as a comedian' });
    }

    // Update existing user with comedian profile
    const result = await db.collection('users').updateOne(
      { email },
      {
        $set: {
          username,
          phone,
          isComedian: true,
          comedianProfile: sanitizedProfile,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'No changes made' });
    }

    res.status(200).json({ message: 'Comedian registration successful' });
  } catch (error) {
    console.error('Comedian registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}