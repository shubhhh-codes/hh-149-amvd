import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function TicketTiersManager() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Early Bird promotion states
  const [earlyBirdActive, setEarlyBirdActive] = useState(false);
  const [earlyBirdPrice, setEarlyBirdPrice] = useState(119);
  const [earlyBirdMaxBookings, setEarlyBirdMaxBookings] = useState(30);
  const [earlyBirdCreatedAt, setEarlyBirdCreatedAt] = useState<any>(new Date());

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      const res = await fetch('/api/admin/cms/ticket-tiers');
      if (res.ok) {
        const data = await res.json();
        setTiers(data.tiers || []);
        setVenue(data.venue || '');
        setDate(data.date || '');
        setTime(data.time || '');
        if (data.earlyBird) {
          setEarlyBirdActive(data.earlyBird.isActive ?? false);
          setEarlyBirdPrice(data.earlyBird.price ?? 119);
          setEarlyBirdMaxBookings(data.earlyBird.maxBookings ?? 30);
          setEarlyBirdCreatedAt(data.earlyBird.createdAt ? new Date(data.earlyBird.createdAt) : new Date());
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load ticket tiers');
    } finally {
      setLoading(false);
    }
  };

  const saveTiers = async (updatedTiers: any[]) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/cms/ticket-tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tiers: updatedTiers,
          venue,
          date,
          time,
          earlyBird: {
            isActive: earlyBirdActive,
            price: earlyBirdPrice,
            maxBookings: earlyBirdMaxBookings,
            createdAt: earlyBirdCreatedAt
          }
        }),
      });
      if (res.ok) {
        setTiers(updatedTiers);
        toast.success('Ticket tiers updated');
      } else {
        toast.error('Failed to update ticket tiers');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update ticket tiers');
    } finally {
      setSaving(false);
    }
  };

  const handleLaunchReset = () => {
    const newDate = new Date();
    setEarlyBirdCreatedAt(newDate);
    alert('A new 48-hour countdown has started.');
  };

  const handleUpdate = (index: number, field: string, value: any) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  // Removed addTier and removeTier to enforce strict Solo/Duo/Squad constraints

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#141414] p-4 rounded-xl border border-white/10">
        <div>
          <h2 className="text-xl font-bold">Ticket Tiers</h2>
          <p className="text-white/60 text-sm">Manage show ticket pricing and packages.</p>
        </div>
        <button 
          onClick={() => saveTiers(tiers)}
          disabled={saving}
          className="bg-primary-container text-on-primary-fixed px-4 py-2 rounded-lg font-bold disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-[#141414] p-4 rounded-xl border border-white/10 space-y-4">
        <h3 className="font-bold text-white/80 border-b border-white/10 pb-2 mb-4">Event Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-white/60">Venue</label>
            <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full bg-[#080808] p-2 rounded border border-white/10 mt-1" placeholder="e.g. The Humours Hub, Ahmedabad" />
          </div>
          <div>
            <label className="text-xs text-white/60">Date</label>
            <input type="text" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#080808] p-2 rounded border border-white/10 mt-1" placeholder="e.g. Saturday" />
          </div>
          <div>
            <label className="text-xs text-white/60">Time</label>
            <input type="text" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-[#080808] p-2 rounded border border-white/10 mt-1" placeholder="e.g. 8:30 PM" />
          </div>
        </div>
      </div>

      <div className="bg-[#141414] p-4 rounded-xl border border-white/10 space-y-4">
        <h3 className="font-bold text-white/80 border-b border-white/10 pb-2 mb-4">Early Bird Special Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 h-full pt-6">
            <input
              type="checkbox"
              id="earlyBirdActive"
              checked={earlyBirdActive}
              onChange={(e) => setEarlyBirdActive(e.target.checked)}
              className="w-5 h-5 rounded border-white/10 bg-[#080808] text-primary-container focus:ring-0 focus:ring-offset-0"
            />
            <label htmlFor="earlyBirdActive" className="text-sm font-medium text-white/80 cursor-pointer">
              Activate Early Bird Offer
            </label>
          </div>
          <div className="flex flex-col justify-end">
            <span className="text-xs text-white/40">Offer Created At</span>
            <span className="text-sm font-semibold text-white/80 mt-1">
              {earlyBirdCreatedAt ? new Date(earlyBirdCreatedAt).toLocaleString() : 'Not launched yet'}
            </span>
          </div>
          <div>
            <label className="text-xs text-white/60">Early Bird Price (₹)</label>
            <input
              type="number"
              value={earlyBirdPrice}
              onChange={(e) => setEarlyBirdPrice(Number(e.target.value))}
              className="w-full bg-[#080808] p-2 rounded border border-white/10 mt-1 text-white"
              placeholder="119"
              min={1}
            />
          </div>
          <div>
            <label className="text-xs text-white/60">Max Bookings (Limit)</label>
            <input
              type="number"
              value={earlyBirdMaxBookings}
              onChange={(e) => setEarlyBirdMaxBookings(Number(e.target.value))}
              className="w-full bg-[#080808] p-2 rounded border border-white/10 mt-1 text-white"
              placeholder="30"
              min={1}
            />
          </div>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLaunchReset}
            className="bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
          >
            Launch / Reset Offer
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {tiers.map((tier, idx) => (
          <div key={idx} className="bg-[#141414] p-4 rounded-xl border border-white/10 space-y-4 relative">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/60">Tier Key (Internal) <span className="text-[#FF6B1A] ml-1">(Read-Only)</span></label>
                <input type="text" value={tier.key} readOnly className="w-full bg-[#080808] opacity-50 cursor-not-allowed p-2 rounded border border-white/10 mt-1" title="Internal keys cannot be changed to protect historical bookings" />
              </div>
              <div>
                <label className="text-xs text-white/60">Display Name</label>
                <input type="text" value={tier.name} onChange={(e) => handleUpdate(idx, 'name', e.target.value)} className="w-full bg-[#080808] p-2 rounded border border-white/10 mt-1" />
              </div>
              <div>
                <label className="text-xs text-white/60">Label (Short)</label>
                <input type="text" value={tier.label} onChange={(e) => handleUpdate(idx, 'label', e.target.value)} className="w-full bg-[#080808] p-2 rounded border border-white/10 mt-1" />
              </div>
              <div>
                <label className="text-xs text-white/60">Price (₹)</label>
                <input type="number" value={tier.price} onChange={(e) => handleUpdate(idx, 'price', Number(e.target.value))} className="w-full bg-[#080808] p-2 rounded border border-white/10 mt-1" />
              </div>
              <div>
                <label className="text-xs text-white/60">Seats Included</label>
                <input type="number" value={tier.seats} onChange={(e) => handleUpdate(idx, 'seats', Number(e.target.value))} className="w-full bg-[#080808] p-2 rounded border border-white/10 mt-1" />
              </div>
              <div>
                <label className="text-xs text-white/60">Badge (Optional)</label>
                <input type="text" value={tier.badge || ''} onChange={(e) => handleUpdate(idx, 'badge', e.target.value || null)} className="w-full bg-[#080808] p-2 rounded border border-white/10 mt-1" placeholder="e.g. MOST POPULAR" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-white/60">Description (Popup Text)</label>
                <textarea value={tier.description || ''} onChange={(e) => handleUpdate(idx, 'description', e.target.value)} className="w-full bg-[#080808] p-2 rounded border border-white/10 mt-1 h-20 resize-y" placeholder="e.g. This ticket admits 1 person of any gender..." />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
