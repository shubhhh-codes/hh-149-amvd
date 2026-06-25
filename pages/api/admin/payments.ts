import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';
import { Document } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (session?.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const client = await clientPromise;
    const db = client.db();

    if (req.method === 'GET') {
      // Get all payments (bookingDetails are already embedded in the payment document now)
      const payments = await db.collection('payments')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      console.log('Fetched payments:', payments.length);

      // Calculate statistics
      const stats = {
        totalAmount: payments
          .filter((p: Document) => p.status === 'completed')
          .reduce((sum: number, p: Document) => sum + ((p.amount as number) || 0), 0),
        totalPayments: payments.length,
        successfulPayments: payments.filter((p: Document) => p.status === 'completed').length,
        failedPayments: payments.filter((p: Document) => p.status !== 'completed').length,
      };

      console.log('Payment stats:', stats);

      return res.status(200).json({
        payments,
        stats
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('Admin payments API error:', error);
    return res.status(500).json({
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
}
