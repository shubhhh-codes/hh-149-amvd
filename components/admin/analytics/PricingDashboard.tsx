import React, { useState } from 'react';
import { BookingData, usePricingAnalytics } from './AnalyticsEngine';
import { KPICard } from './KPICards';
import { RevenueTrendChart, TierSalesPieChart, BeforeAfterBarChart } from './Charts';
import { exportToCSV, exportElementAsPNG } from './ExportUtils';
import { DrillDownModal } from './DrillDownModal';

export default function PricingDashboard({ bookings, venueCapacity }: { bookings: BookingData[], venueCapacity: number }) {
  const [dateFilter, setDateFilter] = useState<'today' | '7d' | '30d' | 'all'>('all');
  const [drillDown, setDrillDown] = useState<{isOpen: boolean, title: string, data: BookingData[]}>({ isOpen: false, title: '', data: [] });
  
  const analytics = usePricingAnalytics(bookings, venueCapacity, process.env.NEXT_PUBLIC_PRICING_ROLLOUT_DATE, dateFilter);
  const { overall, revenueLiftPercent, fillRate, trendData, tierSalesChart, beforeAfterChart, dailyVelocity, estimatedDaysToSellOut, filteredBookings } = analytics;

  const handleExportCSV = () => {
    const data = filteredBookings.map(b => ({
      ID: b.bookingId,
      Date: b.createdAt,
      Status: b.status,
      Tickets: b.numberOfTickets,
      Revenue: b.cart ? b.cart.reduce((s, i) => s + (i.price * i.units), 0) : ((b.numberOfTickets || 0) * 499)
    }));
    exportToCSV(data, `pricing-analytics-${dateFilter}`);
  };

  return (
    <div className="space-y-6" id="pricing-dashboard">
      <div className="flex justify-between items-center bg-[#1c1b1b] p-4 rounded-xl border border-white/5 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wide">Pricing Performance</h2>
          <p className="text-sm text-on-surface/50">Analyze booking velocity and tier conversion</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-[#131313] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#FF6B1A]"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">Entire Event</option>
          </select>
          <button onClick={handleExportCSV} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-sm transition-colors border border-white/5">
            CSV
          </button>
          <button onClick={() => exportElementAsPNG('pricing-dashboard', 'dashboard-export')} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-sm transition-colors border border-white/5">
            PNG
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Revenue" value={`₹${overall.revenue}`} onClick={() => setDrillDown({isOpen: true, title: 'Total Revenue Bookings', data: filteredBookings})} />
        <KPICard title="Total Tickets" value={overall.tickets} onClick={() => setDrillDown({isOpen: true, title: 'All Tickets', data: filteredBookings})} />
        <KPICard title="Avg Rev / Ticket" value={`₹${Math.round(overall.avgRevPerTicket)}`} />
        <KPICard title="Revenue Lift (New vs Old)" value={`${revenueLiftPercent.toFixed(1)}%`} trend={revenueLiftPercent} />
        
        <KPICard title="Venue Fill Rate" value={`${fillRate.toFixed(1)}%`} />
        <KPICard title="Squad Adoption" value={`${overall.squadAdoptionRate.toFixed(1)}%`} />
        <KPICard title="Daily Velocity" value={`${dailyVelocity.toFixed(1)} tix/day`} />
        <KPICard title="Est. Sell Out" value={estimatedDaysToSellOut > 900 ? 'N/A' : `${Math.ceil(estimatedDaysToSellOut)} days`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#131313] p-6 rounded-xl border border-white/5">
          <h3 className="text-sm font-bold text-on-surface/50 tracking-widest uppercase mb-6">Revenue Trend</h3>
          <RevenueTrendChart data={trendData} onDataClick={(item) => {
            const dayBookings = filteredBookings.filter(b => b.createdAt.startsWith(item.date));
            setDrillDown({isOpen: true, title: `Bookings for ${item.date}`, data: dayBookings});
          }} />
        </div>
        <div className="bg-[#131313] p-6 rounded-xl border border-white/5">
          <h3 className="text-sm font-bold text-on-surface/50 tracking-widest uppercase mb-6">Ticket Sales by Tier</h3>
          <TierSalesPieChart data={tierSalesChart} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#131313] p-6 rounded-xl border border-white/5">
          <h3 className="text-sm font-bold text-on-surface/50 tracking-widest uppercase mb-6">Before vs After Pricing Update</h3>
          <BeforeAfterBarChart data={beforeAfterChart} />
        </div>
        <div className="bg-[#131313] p-6 rounded-xl border border-white/5">
          <h3 className="text-sm font-bold text-on-surface/50 tracking-widest uppercase mb-6">Business Insights</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-on-surface/50">Highest Revenue Tier</span>
              <span className="font-bold text-primary-container">
                {tierSalesChart.length > 0 ? [...tierSalesChart].sort((a,b)=>b.value-a.value)[0].name : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-on-surface/50">Avg Revenue / Booking</span>
              <span className="font-bold">₹{Math.round(overall.avgRevPerBooking)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-on-surface/50">Remaining Capacity</span>
              <span className="font-bold">{analytics.remainingCapacity} seats</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-on-surface/50">Proj. Revenue @ 100%</span>
              <span className="font-bold text-green-500">₹{Math.round(analytics.projectedRevenue100)}</span>
            </div>
          </div>
        </div>
      </div>

      <DrillDownModal {...drillDown} onClose={() => setDrillDown(prev => ({...prev, isOpen: false}))} />
    </div>
  );
}
