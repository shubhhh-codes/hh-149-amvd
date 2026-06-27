import React from 'react';

export default function DistributionList({ distributions, onSelect, onCreateEvent }: { distributions: any[], onSelect: (w: any) => void, onCreateEvent: () => void }) {
  
  const calculateProgress = (checklist: any) => {
    let total = 0;
    let done = 0;
    Object.values(checklist).forEach((channel: any) => {
      Object.values(channel).forEach((status: any) => {
        total++;
        if (status) done++;
      });
    });
    return total === 0 ? 0 : Math.round((done / total) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#1c1b1b] p-6 rounded-xl border border-white/5">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wide">Event Distribution</h2>
          <p className="text-on-surface/50 text-sm">Centralized marketing operations platform</p>
        </div>
        <button onClick={onCreateEvent} className="bg-primary-container text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-container/80 transition-colors">
          <span className="material-symbols-outlined text-sm">add</span>
          New Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {distributions.length === 0 && (
          <div className="col-span-full py-12 text-center text-white/50 bg-[#131313] rounded-xl border border-white/5">
            No events found. Create an event to automatically provision a distribution workspace.
          </div>
        )}
        
        {distributions.map(dist => {
          const progress = calculateProgress(dist.checklist);
          return (
            <div 
              key={dist._id} 
              onClick={() => onSelect(dist)}
              className="bg-[#131313] p-6 rounded-xl border border-white/5 cursor-pointer hover:border-primary-container/50 hover:-translate-y-1 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg leading-tight group-hover:text-primary-container transition-colors">{dist.eventName}</h3>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${dist.status === 'launched' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                  {dist.status}
                </span>
              </div>
              <p className="text-sm text-on-surface/50 mb-6">
                <span className="material-symbols-outlined text-[14px] align-middle mr-1">calendar_today</span>
                {new Date(dist.showDate).toLocaleDateString()}
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="uppercase tracking-widest text-on-surface/50">Readiness</span>
                  <span className={progress === 100 ? 'text-green-500' : 'text-primary-container'}>{progress}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
