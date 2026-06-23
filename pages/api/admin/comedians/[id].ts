/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
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

    if (session?.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid comedian ID' });
    }

    const client = await clientPromise;
    const db = client.db();

    if (req.method === 'PUT') {
      const {
        status,
        name,
        speciality,
        tagline,
        instagramUrl,
        photoId,
        displayOrder,
        isFeatured
      } = req.body;

      const updateData: any = {
        updatedAt: new Date()
      };

      // Get user ObjectId for audit trailing
      const adminUser = await db.collection('users').findOne({ email: session.user.email });
      if (adminUser) {
        updateData['comedianProfile.updatedBy'] = adminUser._id;
        updateData['comedianProfile.updatedAt'] = new Date();
      }

      if (status !== undefined) {
        if (!['pending', 'approved', 'declined'].includes(status)) {
          return res.status(400).json({ message: 'Invalid status' });
        }
        updateData['comedianProfile.status'] = status;
      }

      if (name !== undefined) updateData.username = name;
      if (speciality !== undefined) updateData['comedianProfile.speciality'] = speciality;
      if (tagline !== undefined) updateData['comedianProfile.tagline'] = tagline;
      if (instagramUrl !== undefined) updateData['comedianProfile.instagramUrl'] = instagramUrl;
      if (photoId !== undefined) updateData['comedianProfile.photoId'] = photoId ? new ObjectId(photoId) : null;
      if (displayOrder !== undefined) updateData['comedianProfile.displayOrder'] = displayOrder;
      if (isFeatured !== undefined) updateData['comedianProfile.isFeatured'] = isFeatured;

      const result = await db.collection('users').updateOne(
        {
          _id: new ObjectId(id),
          isComedian: true
        },
        {
          $set: updateData
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Comedian not found' });
      }

      return res.status(200).json({ message: 'Comedian updated successfully' });
    }

    if (req.method === 'DELETE') {
      const result = await db.collection('users').deleteOne({
        _id: new ObjectId(id),
        isComedian: true
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Comedian not found' });
      }

      return res.status(200).json({ message: 'Comedian deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Update comedian status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 