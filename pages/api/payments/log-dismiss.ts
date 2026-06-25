import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';
import { sendPaymentCancelledNotification } from '../../../lib/slack';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10kb', // Extremely small limit to prevent payload bloat
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let { bookingId } = req.body;
  
  // Sanitize the bookingId
  if (typeof bookingId !== 'string') {
    return res.status(400).json({ message: 'Invalid bookingId format' });
  }
  
  bookingId = bookingId.slice(0, 50).replace(/[\r\n]/g, '');

  try {
    const client = await clientPromise;
    const db = client.db();

    const booking = await db.collection('bookings').findOne({ bookingId });
    
    if (booking) {
      // Check for repeat attempters
      const previousAttempts = await db.collection('bookings').countDocuments({
        phone: booking.phone,
        status: { $in: ['pending', 'cancelled'] },
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // past 7 days
      });

      const isRepeat = previousAttempts > 1;

      // Update status to cancelled so they don't sit in pending forever
      await db.collection('bookings').updateOne(
        { bookingId },
        { $set: { status: 'cancelled', updatedAt: new Date() } }
      );

      // Fire the Slack webhook
      sendPaymentCancelledNotification({
        bookingId: booking.bookingId,
        fullName: booking.fullName,
        email: booking.email,
        phone: booking.phone,
        numberOfTickets: booking.numberOfTickets,
        cart: booking.cart,
        repeatAttempter: isRepeat,
        totalAttempts: previousAttempts
      });
      
      console.log(`[PAYMENT_CANCELLED] Alert sent for booking: ${bookingId}. Repeat: ${isRepeat}`);
    } else {
      console.log(`[PAYMENT_CANCELLED] Booking not found for: ${bookingId}`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error processing log-dismiss:', err);
    return res.status(500).json({ success: false });
  }
}
