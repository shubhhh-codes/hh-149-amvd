import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import clientPromise from '../../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    console.log('Session in content.ts:', session);
    if (session?.user?.role !== 'admin') {
      console.log('Failed auth check in content.ts. Email:', session?.user?.email, 'Role:', session?.user?.role);
      return res.status(403).json({ message: 'Not authorized' });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const user = await db.collection('users').findOne({ email: session.user.email });
    if (!user) {
      console.log('User not found in DB:', session.user.email);
      return res.status(403).json({ message: 'Admin user not found in DB' });
    }
    const adminId = user._id;

    if (req.method === 'GET') {
      const { type } = req.query;
      const query: any = {};
      if (type) query.type = type;

      const content = await db.collection('homepage_content')
        .find(query)
        .sort({ displayOrder: 1, createdAt: -1 })
        .toArray();

      return res.status(200).json({ content });
    }

    if (req.method === 'POST') {
      const { type, title, subtitle, content, imageUrl, category, metadata, displayOrder, isVisible } = req.body;

      if (!type) {
        return res.status(400).json({ message: 'Type is required' });
      }

      const newContent = {
        type,
        title: title || '',
        subtitle: subtitle || '',
        content: content || '',
        imageUrl: imageUrl || '',
        category: category || '',
        metadata: metadata || {},
        displayOrder: displayOrder ?? 0,
        isVisible: isVisible ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: adminId,
      };

      const result = await db.collection('homepage_content').insertOne(newContent);

      return res.status(201).json({ 
        message: 'Content created successfully', 
        contentId: result.insertedId 
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('CMS content API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

