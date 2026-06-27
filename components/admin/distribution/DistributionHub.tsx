import React, { useState, useEffect, useCallback } from 'react';
import DistributionList from './DistributionList';
import DistributionDetail from './DistributionDetail';

export default function DistributionHub() {
  const [distributions, setDistributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const [eventForm, setEventForm] = useState({
    name: '',
    showDate: '',
    venueName: '',
    capacity: 100
  });

  const fetchDistributions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/distribution');
      const data = await res.json();
      setDistributions(data.distributions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDistributions();
  }, [fetchDistributions]);

  const handleCreateEvent = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.name || !eventForm.showDate || !eventForm.venueName) return;

    // Optimistic UI Update: Create a mock workspace and prepend it immediately
    const tempId = 'temp-' + Date.now();
    const tempWorkspace = {
      _id: tempId,
      eventName: eventForm.name,
      showDate: new Date(eventForm.showDate).toISOString(),
      venueName: eventForm.venueName,
      status: 'draft',
      checklist: {}
    };
    
    setDistributions(prev => [tempWorkspace, ...prev]);
    setShowModal(false);
    setEventForm({ name: '', showDate: '', venueName: '', capacity: 100 });

    try {
      await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tempWorkspace.eventName,
          showDate: tempWorkspace.showDate,
          venueName: tempWorkspace.venueName,
          capacity: Number(eventForm.capacity)
        })
      });
      // Sync real ID from DB
      await fetchDistributions();
    } catch (err) {
      console.error('Failed to create event', err);
      // Revert optimistic update on failure
      setDistributions(prev => prev.filter(d => d._id !== tempId));
    }
  }, [eventForm, fetchDistributions]);

  if (loading) return <div className="p-8 text-white">Loading Distribution Hub...</div>;

  return (
    <div className="w-full h-full text-white relative">
      {selectedWorkspace ? (
        <DistributionDetail 
          workspace={selectedWorkspace} 
          onBack={(deletedId?: string) => { 
            setSelectedWorkspace(null); 
            if (deletedId) {
              setDistributions(prev => prev.filter(d => d._id !== deletedId));
            } else {
              fetchDistributions(); 
            }
          }} 
        />
      ) : (
        <DistributionList 
          distributions={distributions} 
          onSelect={setSelectedWorkspace} 
          onCreateEvent={() => setShowModal(true)} 
        />
      )}

      {/* New Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1b1b] p-6 rounded-xl border border-white/10 w-full max-w-md">
            <h3 className="text-xl font-bold mb-6 text-primary-container">Create New Event</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface/70 uppercase mb-1">Event Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-[#131313] border border-white/10 rounded-lg p-3 text-white focus:border-primary-container outline-none"
                  value={eventForm.name}
                  onChange={e => setEventForm({...eventForm, name: e.target.value})}
                  placeholder="e.g. Open Mic Vol. 1"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface/70 uppercase mb-1">Show Date</label>
                <input 
                  type="datetime-local" 
                  required 
                  className="w-full bg-[#131313] border border-white/10 rounded-lg p-3 text-white focus:border-primary-container outline-none"
                  value={eventForm.showDate}
                  onChange={e => setEventForm({...eventForm, showDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface/70 uppercase mb-1">Venue Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-[#131313] border border-white/10 rounded-lg p-3 text-white focus:border-primary-container outline-none"
                  value={eventForm.venueName}
                  onChange={e => setEventForm({...eventForm, venueName: e.target.value})}
                  placeholder="e.g. The Comedy Club"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface/70 uppercase mb-1">Capacity</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  className="w-full bg-[#131313] border border-white/10 rounded-lg p-3 text-white focus:border-primary-container outline-none"
                  value={eventForm.capacity}
                  onChange={e => setEventForm({...eventForm, capacity: Number(e.target.value)})}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-bold transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-primary-container text-black hover:bg-primary-container/80 rounded-lg font-bold transition-colors">
                  Create & Auto-Setup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
