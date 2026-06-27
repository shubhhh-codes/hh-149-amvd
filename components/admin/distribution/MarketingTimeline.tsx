import React from 'react';

const TIMELINE_STAGES = [
  { days: 30, label: '30 Days Before', desc: 'Announce event & Early Bird tickets' },
  { days: 21, label: '21 Days Before', desc: 'Artist showcase & group pass push' },
  { days: 14, label: '14 Days Before', desc: 'Venue hype & video content' },
  { days: 7, label: '7 Days Before', desc: 'Urgency: Last 7 days, 50% sold out' },
  { days: 3, label: '3 Days Before', desc: 'Urgency: Almost sold out' },
  { days: 1, label: '1 Day Before', desc: 'Tomorrow is the day!' },
  { days: 0, label: 'Event Day', desc: 'Tonight! Door sales info' },
];

export default function MarketingTimeline({ workspace }: { workspace: any }) {
  const showDate = new Date(workspace.showDate);
  const today = new Date();
  
  // Calculate days difference
  const diffTime = showDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-[#1c1b1b] p-6 rounded-xl border border-white/5 relative mt-6">
      <h3 className="font-bold text-lg mb-6 uppercase tracking-wide">Campaign Timeline</h3>
      
      <div className="absolute left-10 top-20 bottom-10 w-0.5 bg-white/10 z-0"></div>

      <div className="space-y-8 relative z-10">
        {TIMELINE_STAGES.map((stage, i) => {
          const isPast = diffDays < stage.days;
          const isCurrent = diffDays === stage.days || (diffDays < stage.days && diffDays > (TIMELINE_STAGES[i+1]?.days || -1));
          
          return (
            <div key={stage.days} className={`flex items-start gap-6 transition-all ${isPast && !isCurrent ? 'opacity-40' : 'opacity-100'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-[#1c1b1b] ${
                isPast 
                  ? 'border-green-500 text-green-500' 
                  : isCurrent 
                    ? 'border-primary-container text-primary-container shadow-[0_0_15px_rgba(255,107,26,0.3)]' 
                    : 'border-white/20 text-white/20'
              }`}>
                {isPast ? <span className="material-symbols-outlined text-[14px]">check</span> : <span className="text-xs font-bold">{stage.days}d</span>}
              </div>
              <div className={`flex-1 p-4 rounded-lg border ${isCurrent ? 'bg-primary-container/5 border-primary-container' : 'bg-[#131313] border-white/5'}`}>
                <div className="flex justify-between items-start">
                  <h4 className={`font-bold ${isCurrent ? 'text-primary-container' : 'text-white'}`}>{stage.label}</h4>
                  {isCurrent && <span className="text-[10px] uppercase font-bold bg-primary-container text-black px-2 py-0.5 rounded animate-pulse">Current Phase</span>}
                </div>
                <p className="text-sm text-on-surface/50 mt-1">{stage.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
