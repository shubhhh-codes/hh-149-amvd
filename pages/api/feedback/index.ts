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
    const { fullName, email, category, vibe, comment } = req.body;

    if (!fullName || !email || !category || !vibe || !comment) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const client = await clientPromise;
    const db = client.db();

    await db.collection('feedbacks').insertOne({
      fullName,
      email: email.toLowerCase().trim(),
      category,
      vibe,
      comment,
      createdAt: new Date(),
    });

    return res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
