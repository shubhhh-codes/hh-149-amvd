import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import clientPromise from '../../../lib/mongodb';
import { issueDownloadToken } from '../../../lib/download-token';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
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

    // Verify Razorpay signature
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

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: 'Missing Razorpay credentials' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    let order;
    try {
      order = await razorpay.orders.fetch(razorpay_order_id);
    } catch (err: any) {
      console.error('Failed to fetch Razorpay order:', err.message);
      return res.status(500).json({ message: 'Failed to verify order details' });
    }

    // CRITICAL FIX: Verify the order was actually created for THIS booking
    if (order.receipt !== bookingId) {
      console.error('Order/Booking mismatch attack detected:', {
        orderReceipt: order.receipt,
        requestedBookingId: bookingId
      });
      return res.status(400).json({ message: 'Order does not match booking' });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get booking details by human-friendly bookingId
    const booking = await db.collection('bookings').findOne({ bookingId });
    
    if (!booking) {
      console.error('Booking not found:', bookingId);
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if payment already processed
    const existingPayment = await db.collection('payments').findOne({
      orderId: razorpay_order_id
    });

    if (existingPayment) {
      console.log('Payment already processed:', razorpay_order_id);
      // Re-issue token so the user can still download even if they refresh the success page
      const downloadToken = issueDownloadToken(bookingId, booking.email);
      return res.status(200).json({ message: 'Payment already verified', bookingId, downloadToken });
    }

    // Create payment record (no userId, guest-only)
    const payment = {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      bookingId: bookingId,
      amount: Number(order.amount), // Use the exact amount from the verified Razorpay order
      status: 'completed',
      type: 'ticket_booking',
      createdAt: new Date(),
      updatedAt: new Date(),
      bookingDetails: {
        numberOfTickets: booking.numberOfTickets,
        fullName: booking.fullName,
        email: booking.email,
        phone: booking.phone,
      }
    };

    // Use upsert to prevent duplicate payment records during race conditions
    await db.collection('payments').updateOne(
      { orderId: razorpay_order_id },
      { $setOnInsert: payment },
      { upsert: true }
    );
    console.log('Payment record processed:', payment.paymentId);

    // Update booking status to approved
    await db.collection('bookings').updateOne(
      { bookingId },
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

    // Issue a signed 30-minute download token so booking-success can fetch the PDF
    // without requiring the user to go through the retrieve page first.
    const downloadToken = issueDownloadToken(bookingId, booking.email);

    res.status(200).json({ message: 'Payment verified successfully', bookingId, downloadToken });
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