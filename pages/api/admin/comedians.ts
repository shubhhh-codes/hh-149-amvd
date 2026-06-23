/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

function generateUserId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const segments = Array(4).fill(0).map(() => {
    return Array(4).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
  });
  return segments.join('-');
}

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

    if (req.method === 'POST') {
      const {
        email,
        username,
        phone,
        speciality,
        tagline,
        instagramUrl,
        photoId,
        displayOrder,
        isFeatured
      } = req.body;

      if (!email || !username || !speciality) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await db.collection('users').findOne({ email: normalizedEmail });

      const cleanPhotoId = (photoId && ObjectId.isValid(photoId)) ? new ObjectId(photoId) : null;

      if (existingUser) {
        if (existingUser.isComedian) {
          return res.status(400).json({ message: 'A performer with this email already exists' });
        }

        const result = await db.collection('users').updateOne(
          { _id: existingUser._id },
          {
            $set: {
              isComedian: true,
              username: username,
              phone: phone || existingUser.phone || '',
              comedianProfile: {
                photoId: cleanPhotoId,
                speciality,
                tagline: tagline || '',
                instagramUrl: instagramUrl || '',
                displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
                isFeatured: isFeatured === true || isFeatured === 'true',
                status: 'approved',
              },
              updatedAt: new Date()
            }
          }
        );

        if (result.matchedCount === 0) {
          return res.status(500).json({ message: 'Failed to update user status' });
        }

        return res.status(200).json({ message: 'User upgraded to performer successfully' });
      } else {
        const userId = generateUserId();
        const randomPassword = randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 12);

        const result = await db.collection('users').insertOne({
          userId,
          username,
          email: normalizedEmail,
          password: hashedPassword,
          phone: phone || '',
          isComedian: true,
          comedianProfile: {
            photoId: cleanPhotoId,
            speciality,
            tagline: tagline || '',
            instagramUrl: instagramUrl || '',
            displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
            isFeatured: isFeatured === true || isFeatured === 'true',
            status: 'approved',
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        if (!result.insertedId) {
          return res.status(500).json({ message: 'Failed to create performer' });
        }

        return res.status(201).json({ message: 'Performer created successfully', userId: result.insertedId });
      }
    }

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
      const { comedianId, status, isFeatured } = req.body;

      if (!comedianId) {
        return res.status(400).json({ message: 'Comedian ID is required' });
      }

      const updateFields: any = { updatedAt: new Date() };

      if (status) {
        if (!['pending', 'approved', 'declined'].includes(status)) {
          return res.status(400).json({ message: 'Invalid status' });
        }
        updateFields['comedianProfile.status'] = status;
      }

      if (isFeatured !== undefined) {
        updateFields['comedianProfile.isFeatured'] = isFeatured;
      }

      const result = await db.collection('users').updateOne(
        {
          _id: new ObjectId(comedianId),
          isComedian: true
        },
        {
          $set: updateFields
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
