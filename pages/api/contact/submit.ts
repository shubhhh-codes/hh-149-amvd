import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { name, phone, subject, message } = req.body;

    if (!name || !phone || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('contact_messages').insertOne({
      name,
      phone,
      subject,
      message,
      status: 'unread',
      createdAt: new Date()
    });

    return res.status(201).json({ success: true, messageId: result.insertedId });
  } catch (error: any) {
    console.error('Contact submission error:', error);
    return res.status(500).json({ message: 'Failed to submit message. Please try again later.' });
  }
}
