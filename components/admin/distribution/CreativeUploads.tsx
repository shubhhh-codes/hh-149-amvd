import React, { useState } from 'react';

export default function CreativeUploads({ workspace }: { workspace: any }) {
  const [creatives, setCreatives] = useState<{name: string, url: string}[]>(workspace.creatives || []);
  const [newCreative, setNewCreative] = useState({ name: '', url: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCreative.name || !newCreative.url) return;
    
    setSaving(true);
    const updatedCreatives = [...creatives, newCreative];
    
    try {
      await fetch('/api/admin/distribution', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: workspace._id, creatives: updatedCreatives })
      });
      setCreatives(updatedCreatives);
      setNewCreative({ name: '', url: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (index: number) => {
    const updatedCreatives = creatives.filter((_, i) => i !== index);
    setCreatives(updatedCreatives);
    
    await fetch('/api/admin/distribution', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: workspace._id, creatives: updatedCreatives })
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1c1b1b] p-6 rounded-xl border border-white/5">
        <h3 className="font-bold text-lg mb-2 text-primary-container">Creative Assets Manager</h3>
        <p className="text-sm text-on-surface/50 mb-6">Store links to Canva designs, Google Drive folders, or finalized promotional videos.</p>
        
        <form onSubmit={handleSave} className="flex gap-4 mb-8">
          <input 
            type="text" 
            placeholder="Asset Name (e.g. Official Poster)" 
            className="flex-1 bg-[#131313] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-primary-container outline-none"
            value={newCreative.name}
            onChange={e => setNewCreative({...newCreative, name: e.target.value})}
            required
          />
          <input 
            type="url" 
            placeholder="URL (https://...)" 
            className="flex-1 bg-[#131313] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-primary-container outline-none"
            value={newCreative.url}
            onChange={e => setNewCreative({...newCreative, url: e.target.value})}
            required
          />
          <button 
            type="submit" 
            disabled={saving}
            className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add Link'}
          </button>
        </form>

        <div className="space-y-3">
          {creatives.length === 0 ? (
            <div className="text-center py-8 text-on-surface/30 text-sm border border-dashed border-white/10 rounded-lg">
              No creative assets linked yet.
            </div>
          ) : (
            creatives.map((asset, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">link</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{asset.name}</h4>
                    <a href={asset.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                      {asset.url.length > 50 ? asset.url.substring(0, 50) + '...' : asset.url}
                    </a>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemove(i)}
                  className="w-8 h-8 rounded hover:bg-error/20 text-error flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
