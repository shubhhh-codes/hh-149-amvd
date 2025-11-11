import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';

// Initialize Razorpay with proper error handling
let razorpay: Razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
} catch (error: any) {
  console.error('Razorpay initialization error:', {
    message: error.message,
    details: error.error?.description || error.description,
    code: error.code,
    statusCode: error.statusCode,
  });
  throw new Error('Failed to initialize Razorpay');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify credentials are available
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials missing:', {
        keyId: process.env.RAZORPAY_KEY_ID ? 'present' : 'missing',
        keySecret: process.env.RAZORPAY_KEY_SECRET ? 'present' : 'missing'
      });
      throw new Error('Missing Razorpay credentials');
    }

    const { numberOfTickets } = req.body;

    if (!numberOfTickets || numberOfTickets < 1) {
      return res.status(400).json({ message: 'Invalid number of tickets' });
    }

    const amount = numberOfTickets * 14900; // ₹149 per ticket in paise
    const currency = 'INR';

    const options = {
      amount,
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    console.log('Creating Razorpay order with options:', {
      ...options,
      key_id: `${process.env.RAZORPAY_KEY_ID?.substring(0, 8)}...`,
      environment: process.env.NODE_ENV
    });

    const order = await razorpay.orders.create(options);
    
    console.log('Order created successfully:', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });

    return res.status(200).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      orderId: order.id,
    });
  } catch (error: any) {
    console.error('Order creation error:', {
      message: error.message,
      details: error.error?.description || error.description,
      code: error.code,
      statusCode: error.statusCode,
    });

    // Handle specific error cases
    if (error?.statusCode === 401) {
      return res.status(500).json({ 
        message: 'Payment gateway authentication failed',
        error: 'AUTH_FAILED'
      });
    }

    return res.status(500).json({ 
      message: 'Failed to create payment order',
      error: error.error?.description || error.message
    });
  }
}
