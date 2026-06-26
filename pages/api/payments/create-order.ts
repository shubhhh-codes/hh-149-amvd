import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';

import clientPromise from '../../../lib/mongodb';
import { sendErrorNotification } from '../../../lib/discord';

import { withErrorHandler } from '../../../lib/withErrorHandler';

async function handler(
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

    const { numberOfTickets, bookingId, cart } = req.body;

    if (!numberOfTickets || numberOfTickets < 1) {
      return res.status(400).json({ message: 'Invalid number of tickets' });
    }

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
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

    let calculatedTotal = 0;
    for (const item of cart) {
      const tier = tiers.find((t: any) => t.key === item.tierKey);
      if (!tier) {
        return res.status(400).json({ message: `Invalid or missing ticket tier: ${item.tierKey}` });
      }
      const itemUnits = Number(item.units) || 1;
      calculatedTotal += itemUnits * tier.price;
    }

    const amount = calculatedTotal * 100; // total price in paise
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
    console.error('Create order error:', error);

    // Razorpay wraps errors in a nested 'error' object instead of a standard JS Error
    const actualErrorMessage = error?.error?.description || error?.description || error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
    const stackTrace = error?.stack || `Error Code: ${error?.error?.code || error?.statusCode || 'Unknown'}\nReason: ${error?.error?.reason || 'Unknown'}`;

    sendErrorNotification({
      source: 'Payment Gateway',
      errorMessage: actualErrorMessage,
      errorStack: stackTrace,
      url: '/api/payments/create-order',
      context: req.body
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

export default withErrorHandler(handler);
