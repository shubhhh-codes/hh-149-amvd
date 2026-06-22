import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import clientPromise from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { getGridFSBucket } from '../../../../../lib/gridfs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    console.log('Session in [id].ts:', session);
    if (!session?.user?.email || (session.user.role !== 'admin' && session.user.email !== 'admin@humorshub.com')) {
      console.log('Failed auth check in [id].ts. Email:', session?.user?.email, 'Role:', session?.user?.role);
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { id } = req.query;
    if (!id || typeof id !== 'string' || !ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid content ID' });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const user = await db.collection('users').findOne({ email: session.user.email });
    if (!user) return res.status(403).json({ message: 'Admin user not found in DB' });
    const adminId = user._id;

    const objectId = new ObjectId(id);

    if (req.method === 'PUT') {
      const { type, title, subtitle, content, imageUrl, category, metadata, displayOrder, isVisible } = req.body;
      
      const updateData: any = {
        updatedAt: new Date(),
        updatedBy: adminId,
      };

      if (type !== undefined) updateData.type = type;
      if (title !== undefined) updateData.title = title;
      if (subtitle !== undefined) updateData.subtitle = subtitle;
      if (content !== undefined) updateData.content = content;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (category !== undefined) updateData.category = category;
      if (metadata !== undefined) updateData.metadata = metadata;
      if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
      if (isVisible !== undefined) updateData.isVisible = isVisible;

      const result = await db.collection('homepage_content').updateOne(
        { _id: objectId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) return res.status(404).json({ message: 'Content not found' });
      return res.status(200).json({ message: 'Content updated successfully' });
    }

    if (req.method === 'DELETE') {
      const { permanent } = req.query;

      if (permanent === 'true') {
        const content = await db.collection('homepage_content').findOne({ _id: objectId });
        
        if (content?.imageUrl && content.imageUrl.startsWith('/api/images/')) {
          try {
            const imageIdStr = content.imageUrl.split('/api/images/')[1];
            if (ObjectId.isValid(imageIdStr)) {
              const bucket = await getGridFSBucket();
              await bucket.delete(new ObjectId(imageIdStr));
            }
          } catch (e) {
            console.error('Failed to delete associated image from GridFS:', e);
          }
        }

        const result = await db.collection('homepage_content').deleteOne({ _id: objectId });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Content not found' });
        return res.status(200).json({ message: 'Content deleted permanently' });
      } else {
        const result = await db.collection('homepage_content').updateOne(
          { _id: objectId },
          { 
            $set: { 
              isDeleted: true,
              updatedAt: new Date(),
              updatedBy: adminId,
            } 
          }
        );
        
        if (result.matchedCount === 0) return res.status(404).json({ message: 'Content not found' });
        return res.status(200).json({ message: 'Content archived successfully' });
      }
    }

    if (req.method === 'PATCH') {
      const { restore, isVisible } = req.body;
      const updateData: any = {
        updatedAt: new Date(),
        updatedBy: adminId,
      };

      if (restore) updateData.isDeleted = false;
      if (isVisible !== undefined) updateData.isVisible = isVisible;

      const result = await db.collection('homepage_content').updateOne(
        { _id: objectId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) return res.status(404).json({ message: 'Content not found' });
      return res.status(200).json({ message: 'Content patched successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('CMS content ID API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
