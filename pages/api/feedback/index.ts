import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';
import { sanitizeText } from '../../../lib/sanitize';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100kb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { fullName, email, category, vibe, comment } = req.body;

    if (!fullName || !email || !category || !vibe || !comment) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    if (
      typeof fullName !== 'string' || fullName.trim().length === 0 || fullName.length > 100 ||
      typeof email !== 'string' || email.trim().length === 0 || email.length > 200 ||
      typeof category !== 'string' || category.trim().length === 0 || category.length > 50 ||
      typeof vibe !== 'string' || vibe.trim().length === 0 || vibe.length > 50 ||
      typeof comment !== 'string' || comment.trim().length === 0 || comment.length > 2000
    ) {
      return res.status(400).json({ message: 'Invalid input format or length.' });
    }

    const client = await clientPromise;
    const db = client.db();

    await db.collection('feedbacks').insertOne({
      fullName,
      email: email.toLowerCase().trim(),
      category,
      vibe,
      comment: sanitizeText(comment),
      createdAt: new Date(),
    });

    return res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
