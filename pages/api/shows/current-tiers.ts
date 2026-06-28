import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

import { withErrorHandler } from '../../../lib/withErrorHandler';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const settings = await db.collection('settings').findOne({ type: 'ticket-tiers' });
    
    // Default fallback tiers if none exist
    let tiers = settings?.tiers || [
      { key: 'solo', name: 'Solo Pass', label: 'SOLO', price: 499, seats: 1, badge: null, displayOrder: 1 },
      { key: 'duo', name: 'Duo Pass', label: 'DUO', price: 899, seats: 2, badge: 'MOST POPULAR', displayOrder: 2 },
      { key: 'squad', name: 'Squad Pass', label: 'SQUAD', price: 1599, seats: 4, badge: null, displayOrder: 3 },
    ];

    // Sort by display order
    tiers.sort((a: any, b: any) => a.displayOrder - b.displayOrder);

    const publicTiers = tiers.map((t: any) => ({
      key: t.key,
      name: t.name,
      label: t.label,
      price: t.price,
      seats: t.seats,
      badge: t.badge,
      displayOrder: t.displayOrder
    }));

    const inventoryDoc = await db.collection('inventory').findOne({ type: 'venue_capacity' });
    const VENUE_CAPACITY = inventoryDoc?.maxCapacity || 150;
    const totalBookings = await db.collection('bookings')
      .aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$numberOfTickets' } } }
      ])
      .toArray();
    const totalApproved = totalBookings[0]?.total || 0;
    const seatsRemaining = Math.max(0, VENUE_CAPACITY - totalApproved);

    res.status(200).json({
      tiers: publicTiers,
      showId: 'default-show',
      showName: 'The Humours Hub - Live Standup',
      seatsRemaining: seatsRemaining, 
      venueName: 'The Black Box',
      showDate: 'Sat, 24 Oct • 8:30 PM'
    });
  } catch (error) {
    console.error('Error fetching tiers:', error);
    res.status(500).json({ message: 'Failed to fetch tiers' });
  }
}

export default withErrorHandler(handler);
