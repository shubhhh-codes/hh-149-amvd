import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function TicketTiersManager() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      const res = await fetch('/api/admin/cms/ticket-tiers');
      if (res.ok) {
        const data = await res.json();
        setTiers(data.tiers || []);
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
        body: JSON.stringify({ tiers: updatedTiers }),
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

  const handleUpdate = (index: number, field: string, value: any) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  const addTier = () => {
    const newTiers = [...tiers, { key: `tier-${Date.now()}`, name: 'New Tier', label: 'NEW', price: 0, seats: 1, badge: null, displayOrder: tiers.length + 1 }];
    setTiers(newTiers);
  };

  const removeTier = (index: number) => {
    const newTiers = tiers.filter((_, i) => i !== index);
    setTiers(newTiers);
  };

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

      <div className="space-y-4">
        {tiers.map((tier, idx) => (
          <div key={idx} className="bg-[#141414] p-4 rounded-xl border border-white/10 space-y-4 relative">
            <button onClick={() => removeTier(idx)} className="absolute top-4 right-4 text-error">
              <span className="material-symbols-outlined">delete</span>
            </button>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/60">Tier Key (Internal)</label>
                <input type="text" value={tier.key} onChange={(e) => handleUpdate(idx, 'key', e.target.value)} className="w-full bg-[#080808] p-2 rounded border border-white/10 mt-1" />
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
            </div>
          </div>
        ))}
        
        <button onClick={addTier} className="w-full border border-dashed border-white/20 p-4 rounded-xl text-white/60 hover:text-white hover:border-white/50 transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">add</span> Add New Tier
        </button>
      </div>
    </div>
  );
}
