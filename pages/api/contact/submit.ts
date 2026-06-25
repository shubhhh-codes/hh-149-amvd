import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { sanitizeText } from '@/lib/sanitize';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100kb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    if (
      typeof name !== 'string' || name.trim().length === 0 || name.length > 100 ||
      email.length > 200 ||
      typeof phone !== 'string' || phone.trim().length === 0 || phone.length > 50 ||
      typeof subject !== 'string' || subject.trim().length === 0 || subject.length > 200 ||
      typeof message !== 'string' || message.trim().length === 0 || message.length > 5000
    ) {
      return res.status(400).json({ message: 'Invalid input format or length.' });
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('contact_messages').insertOne({
      name,
      email: email.trim(),
      phone,
      subject,
      message: sanitizeText(message),
      status: 'unread',
      createdAt: new Date()
    });

    return res.status(201).json({ success: true, messageId: result.insertedId });
  } catch (error: any) {
    console.error('Contact submission error:', error);
    return res.status(500).json({ message: 'Failed to submit message. Please try again later.' });
  }
}
