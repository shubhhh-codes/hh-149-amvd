import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';

import clientPromise from '../../../lib/mongodb';

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
      return res.status(500).json({ message: 'Missing Razorpay credentials' });
    }

    // Initialize Razorpay inside the handler — avoids module-level crash
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { numberOfTickets, bookingId, tierKey, units } = req.body;

    if (!numberOfTickets || numberOfTickets < 1) {
      return res.status(400).json({ message: 'Invalid number of tickets' });
    }

    // Fetch dynamic ticket tier from CMS
    const client = await clientPromise;
    const DEFAULT_TIERS = [
      { key: 'solo', name: 'Solo Pass', label: 'SOLO', price: 499, seats: 1, badge: null, displayOrder: 1 },
      { key: 'duo', name: 'Duo Pass', label: 'DUO', price: 899, seats: 2, badge: 'MOST POPULAR', displayOrder: 2 },
      { key: 'squad', name: 'Squad Pass', label: 'SQUAD', price: 1599, seats: 4, badge: null, displayOrder: 3 },
    ];

    const db = client.db();
    const settings = await db.collection('settings').findOne({ type: 'ticket-tiers' });
    let tiers = settings?.tiers || [];
    
    if (tiers.length === 0) {
      tiers = DEFAULT_TIERS;
    }

    const tier = tiers.find((t: any) => t.key === tierKey);
    
    if (!tier) {
      return res.status(400).json({ message: 'Invalid or missing ticket tier' });
    }
    
    const ticketPrice = tier.price; 
    const numberOfUnits = units || 1;

    const amount = numberOfUnits * ticketPrice * 100; // total price in paise
    const currency = 'INR';

    const options = {
      amount,
      currency,
      receipt: bookingId || `receipt_${Date.now()}`,
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
