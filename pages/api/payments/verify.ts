import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import crypto from 'crypto';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = await getToken({ req });
    if (!token?.email) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return res.status(400).json({ message: 'Missing required payment details' });
    }

    console.log('Verifying payment:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      bookingId
    });

    // Verify signature
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      console.error('Signature verification failed:', {
        expected: digest,
        received: razorpay_signature
      });
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get booking details
    const booking = await db.collection('bookings').findOne({ 
      _id: new ObjectId(bookingId)
    });
    
    if (!booking) {
      console.error('Booking not found:', bookingId);
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Get user details
    const user = await db.collection('users').findOne({ email: token.email });
    if (!user) {
      console.error('User not found:', token.email);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if payment already processed
    const existingPayment = await db.collection('payments').findOne({
      orderId: razorpay_order_id
    });

    if (existingPayment) {
      console.log('Payment already processed:', razorpay_order_id);
      return res.status(200).json({ message: 'Payment already verified' });
    }

    // Create payment record
    const payment = {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      bookingId: bookingId,
      userId: user._id.toString(),
      email: token.email,
      amount: booking.numberOfTickets * 14900, // ₹149 per ticket in paise
      status: 'completed',
      type: 'ticket_booking',
      createdAt: new Date(),
      updatedAt: new Date(),
      bookingDetails: {
        numberOfTickets: booking.numberOfTickets,
        fullName: booking.fullName,
      }
    };

    await db.collection('payments').insertOne(payment);
    console.log('Payment record created:', payment.paymentId);

    // Update booking status
    await db.collection('bookings').updateOne(
      { _id: new ObjectId(bookingId) },
      {
        $set: {
          status: 'approved',
          paymentStatus: 'completed',
          paymentId: razorpay_payment_id,
          updatedAt: new Date(),
        }
      }
    );
    console.log('Booking updated:', bookingId);

    res.status(200).json({ message: 'Payment verified successfully' });
  } catch (error: any) {
    console.error('Payment verification error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Payment verification failed',
      error: error.message 
    });
  }
}