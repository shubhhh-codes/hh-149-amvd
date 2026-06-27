import React, { useState, useCallback } from 'react';
import Checklist from './Checklist';
import AssetGenerator from './AssetGenerator';
import CreativeUploads from './CreativeUploads';
import MarketingTimeline from './MarketingTimeline';

export default function DistributionDetail({ workspace, onBack }: { workspace: any, onBack: (deletedId?: string) => void }) {
  const [activeTab, setActiveTab] = useState<'checklist' | 'timeline' | 'assets' | 'creatives'>('checklist');

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this event and its distribution workspace?')) return;
    try {
      // Optimistic delete
      onBack(workspace._id);
      await fetch(`/api/admin/distribution?id=${workspace._id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  }, [workspace._id, onBack]);

  const tabs = [
    { id: 'checklist', label: 'Checklist', icon: 'checklist' },
    { id: 'timeline', label: 'Timeline', icon: 'schedule' },
    { id: 'assets', label: 'AI Generator', icon: 'smart_toy' },
    { id: 'creatives', label: 'Creatives & Links', icon: 'image' },
  ];

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between bg-[#1c1b1b] p-6 rounded-xl border border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => onBack()} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-wide">{workspace.eventName}</h2>
            <p className="text-on-surface/50 text-sm">{new Date(workspace.showDate).toLocaleDateString()} • {workspace.status}</p>
          </div>
        </div>
        <button 
          onClick={handleDelete}
          className="w-10 h-10 rounded-full hover:bg-error/20 text-error flex items-center justify-center transition-colors"
          title="Delete Event"
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>

      <div className="flex gap-2 bg-[#1c1b1b] p-2 rounded-xl border border-white/5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-bold uppercase tracking-wider ${
              activeTab === tab.id ? 'bg-primary-container text-black' : 'text-on-surface/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-[#131313] p-6 rounded-xl border border-white/5 overflow-y-auto">
        {activeTab === 'checklist' && <Checklist workspace={workspace} />}
        {activeTab === 'timeline' && <MarketingTimeline workspace={workspace} />}
        {activeTab === 'assets' && <AssetGenerator workspace={workspace} />}
        {activeTab === 'creatives' && <CreativeUploads workspace={workspace} />}
      </div>
    </div>
  );
}
