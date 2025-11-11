import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../utils/mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify user session
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { email, currentPassword, newPassword } = req.body;

  // Validate inputs
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Email, current password, and new password are required' });
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  try {
    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Find user by email
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user's password
    await usersCollection.updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
