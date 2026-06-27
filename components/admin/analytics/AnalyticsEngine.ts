import { useMemo } from 'react';
import { isAfter, isBefore, subDays, startOfDay, endOfDay, isWithinInterval, parseISO, differenceInDays } from 'date-fns';

export interface BookingData {
  _id: string;
  bookingId: string;
  status: 'pending' | 'approved' | 'cancelled';
  numberOfTickets?: number;
  createdAt: string;
  cart?: Array<{ tierKey: string; units: number; seats: number; price: number }>;
}

export function usePricingAnalytics(
  bookings: BookingData[], 
  venueCapacity: number, 
  rolloutDateStr: string = process.env.NEXT_PUBLIC_PRICING_ROLLOUT_DATE || '2026-06-27T00:00:00Z',
  dateFilter: 'today' | '7d' | '30d' | 'all' = 'all'
) {
  return useMemo(() => {
    const rolloutDate = parseISO(rolloutDateStr);
    const now = new Date();
    
    // 1. Filter bookings by dateRange
    let filteredBookings = bookings;
    if (dateFilter !== 'all') {
      const start = dateFilter === 'today' ? startOfDay(now) : subDays(now, dateFilter === '7d' ? 7 : 30);
      filteredBookings = bookings.filter(b => isAfter(parseISO(b.createdAt), start));
    }

    // 2. Separate into Active (Approved) and Cancelled
    const activeBookings = filteredBookings.filter(b => b.status === 'approved');
    const cancelledBookings = filteredBookings.filter(b => b.status === 'cancelled');
    
    const oldPricingBookings = activeBookings.filter(b => isBefore(parseISO(b.createdAt), rolloutDate));
    const newPricingBookings = activeBookings.filter(b => !isBefore(parseISO(b.createdAt), rolloutDate));

    // Helper to calc metrics for a cohort
    const calcMetrics = (cohort: BookingData[]) => {
      let revenue = 0;
      let tickets = 0;
      let squadTickets = 0;
      let soloTickets = 0;
      let duoTickets = 0;
      
      const revenueByTier: Record<string, number> = { solo: 0, duo: 0, squad: 0 };
      const ticketsByTier: Record<string, number> = { solo: 0, duo: 0, squad: 0 };

      cohort.forEach(b => {
        const tix = b.numberOfTickets || 0;
        tickets += tix;
        if (b.cart && b.cart.length > 0) {
          b.cart.forEach(item => {
            const itemRev = item.price * item.units;
            revenue += itemRev;
            const itemSeats = item.seats * item.units;
            if (item.tierKey === 'squad') { squadTickets += itemSeats; revenueByTier.squad += itemRev; ticketsByTier.squad += itemSeats; }
            else if (item.tierKey === 'solo') { soloTickets += itemSeats; revenueByTier.solo += itemRev; ticketsByTier.solo += itemSeats; }
            else if (item.tierKey === 'duo') { duoTickets += itemSeats; revenueByTier.duo += itemRev; ticketsByTier.duo += itemSeats; }
            else {
               // Fallback if there are other tiers
               revenueByTier[item.tierKey] = (revenueByTier[item.tierKey] || 0) + itemRev;
               ticketsByTier[item.tierKey] = (ticketsByTier[item.tierKey] || 0) + itemSeats;
            }
          });
        } else {
          // Fallback for old bookings without cart
          // Assume old pricing
          revenue += (tix * 499); 
          ticketsByTier.solo += tix;
          revenueByTier.solo += (tix * 499);
        }
      });
      
      return {
        revenue,
        tickets,
        bookingsCount: cohort.length,
        avgRevPerTicket: tickets > 0 ? revenue / tickets : 0,
        avgRevPerBooking: cohort.length > 0 ? revenue / cohort.length : 0,
        squadAdoptionRate: tickets > 0 ? (squadTickets / tickets) * 100 : 0,
        ticketsByTier,
        revenueByTier
      };
    };

    const overall = calcMetrics(activeBookings);
    const oldMetrics = calcMetrics(oldPricingBookings);
    const newMetrics = calcMetrics(newPricingBookings);
    
    // Revenue Lift vs Old
    const revenueLiftPercent = oldMetrics.avgRevPerTicket > 0 
       ? ((newMetrics.avgRevPerTicket - oldMetrics.avgRevPerTicket) / oldMetrics.avgRevPerTicket) * 100 
       : 0;

    // Fill Rate & Capacity
    const fillRate = venueCapacity > 0 ? (overall.tickets / venueCapacity) * 100 : 0;
    const remainingCapacity = Math.max(0, venueCapacity - overall.tickets);
    const projectedRevenue100 = overall.avgRevPerTicket * venueCapacity;
    const lostRevenueToCancellations = cancelledBookings.reduce((sum, b) => {
       if (b.cart) return sum + b.cart.reduce((s, i) => s + (i.price * i.units), 0);
       return sum + ((b.numberOfTickets || 0) * 499);
    }, 0);

    // Daily Trend
    const dailyBookings: Record<string, { date: string; revenue: number; tickets: number }> = {};
    activeBookings.forEach(b => {
      const dateKey = parseISO(b.createdAt).toISOString().split('T')[0];
      if (!dailyBookings[dateKey]) dailyBookings[dateKey] = { date: dateKey, revenue: 0, tickets: 0 };
      dailyBookings[dateKey].tickets += b.numberOfTickets || 0;
      
      if (b.cart) {
         dailyBookings[dateKey].revenue += b.cart.reduce((s, i) => s + (i.price * i.units), 0);
      } else {
         dailyBookings[dateKey].revenue += ((b.numberOfTickets || 0) * 499);
      }
    });

    const trendData = Object.values(dailyBookings).sort((a, b) => a.date.localeCompare(b.date));

    // Velocity (tickets per day over the filtered period)
    const daysInPeriod = dateFilter === 'today' ? 1 : dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : Math.max(1, differenceInDays(now, activeBookings.length > 0 ? parseISO(activeBookings[activeBookings.length - 1].createdAt) : now));
    const dailyVelocity = overall.tickets / Math.max(1, daysInPeriod);
    const estimatedDaysToSellOut = dailyVelocity > 0 ? remainingCapacity / dailyVelocity : 999;
    
    // Tier Chart Data
    const tierSalesChart = Object.keys(overall.ticketsByTier).map(k => ({
      name: k.toUpperCase(),
      value: overall.ticketsByTier[k]
    })).filter(x => x.value > 0);

    const tierRevChart = Object.keys(overall.revenueByTier).map(k => ({
      name: k.toUpperCase(),
      value: overall.revenueByTier[k]
    })).filter(x => x.value > 0);

    const beforeAfterChart = [
      { name: 'Avg Rev/Ticket', Old: oldMetrics.avgRevPerTicket, New: newMetrics.avgRevPerTicket },
      { name: 'Avg Rev/Booking', Old: oldMetrics.avgRevPerBooking, New: newMetrics.avgRevPerBooking },
      { name: 'Squad Adoption %', Old: oldMetrics.squadAdoptionRate, New: newMetrics.squadAdoptionRate }
    ];

    return {
      overall,
      oldMetrics,
      newMetrics,
      revenueLiftPercent,
      fillRate,
      remainingCapacity,
      projectedRevenue100,
      lostRevenueToCancellations,
      trendData,
      tierSalesChart,
      tierRevChart,
      beforeAfterChart,
      dailyVelocity,
      estimatedDaysToSellOut,
      filteredBookings // For drill down
    };
  }, [bookings, venueCapacity, rolloutDateStr, dateFilter]);
}
