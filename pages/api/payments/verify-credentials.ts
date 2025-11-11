import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // Try to fetch a simple API endpoint to verify credentials
    const result = await razorpay.payments.all({
      from: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000),
      to: Math.floor(Date.now() / 1000),
    });

    res.status(200).json({ 
      message: 'Credentials verified successfully',
      keyId: process.env.RAZORPAY_KEY_ID?.slice(0, 8) + '...',
    });
  } catch (error: any) {
    console.error('Credential verification error:', error);
    res.status(500).json({ 
      message: 'Failed to verify credentials',
      error: error.error?.description || error.message
    });
  }
}