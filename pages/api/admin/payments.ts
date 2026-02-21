import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';
import { ObjectId, Document } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email || session.user.email !== 'admin@humorshub.com') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const client = await clientPromise;
    const db = client.db();

    if (req.method === 'GET') {
      // Get all payments with user and booking details
      const payments = await db.collection('payments')
        .aggregate([
          {
            $lookup: {
              from: 'users',
              let: { userId: { $toObjectId: '$userId' } },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$_id', '$$userId'] }
                  }
                },
                {
                  $project: {
                    username: 1,
                    email: 1
                  }
                }
              ],
              as: 'user'
            }
          },
          {
            $lookup: {
              from: 'bookings',
              let: { bookingId: { $toObjectId: '$bookingId' } },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$_id', '$$bookingId'] }
                  }
                }
              ],
              as: 'booking'
            }
          },
          {
            $unwind: {
              path: '$user',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind: {
              path: '$booking',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $addFields: {
              bookingDetails: {
                $cond: {
                  if: { $ifNull: ['$bookingDetails', false] },
                  then: '$bookingDetails',
                  else: {
                    numberOfTickets: '$booking.numberOfTickets',
                    fullName: '$booking.fullName'
                  }
                }
              }
            }
          },
          {
            $sort: { createdAt: -1 }
          }
        ]).toArray();

      console.log('Fetched payments:', payments.length);

      // Calculate statistics
      const stats = {
        totalAmount: payments.reduce((sum: number, p: Document) => sum + ((p.amount as number) || 0), 0),
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