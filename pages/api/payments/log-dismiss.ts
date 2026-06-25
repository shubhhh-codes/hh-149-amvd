import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10kb', // Extremely small limit to prevent payload bloat
    },
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let { bookingId } = req.body;
  
  // Sanitize the bookingId to prevent Log Forging / CRLF injection and memory bloat
  if (typeof bookingId !== 'string') {
    bookingId = 'InvalidFormat';
  } else {
    // Truncate to 50 chars and strip all newlines/carriage returns
    bookingId = bookingId.slice(0, 50).replace(/[\r\n]/g, '');
  }
  
  // This log will securely print in your Node.js terminal and Vercel logs
  console.log(`[PAYMENT_CANCELLED] Razorpay modal dismissed by user for booking: ${bookingId || 'Unknown'}`);

  return res.status(200).json({ success: true });
}
