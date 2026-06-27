import React, { useState, useRef, useCallback, useMemo } from 'react';
import { DISTRIBUTION_CHANNELS } from '../../../pages/api/admin/events/distribution-automation';

export default function Checklist({ workspace }: { workspace: any }) {
  const [checklist, setChecklist] = useState(workspace.checklist);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleToggle = useCallback((channelId: string, task: string) => {
    setChecklist((prevChecklist: any) => {
      const newChecklist = {
        ...prevChecklist,
        [channelId]: {
          ...prevChecklist[channelId],
          [task]: !prevChecklist[channelId][task]
        }
      };

      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout to save after 1000ms
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await fetch('/api/admin/distribution', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: workspace._id, checklist: newChecklist })
          });
        } catch (err) {
          console.error('Failed to sync checklist to DB', err);
        }
      }, 1000);

      return newChecklist;
    });
  }, [workspace._id]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {DISTRIBUTION_CHANNELS.map(channel => {
        const tasks = channel.tasks;
        const channelState = checklist[channel.id] || {};
        
        // Calculate progress directly (no hooks inside loop)
        const completed = tasks.filter((t: string) => channelState[t]).length;
        const progress = Math.round((completed / tasks.length) * 100);

        return (
          <div key={channel.id} className="bg-[#1c1b1b] p-5 rounded-xl border border-white/5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{channel.name}</h3>
              <span className={`text-xs font-bold ${progress === 100 ? 'text-green-500' : 'text-primary-container'}`}>{progress}%</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full mb-6">
              <div className={`h-full rounded-full transition-all duration-300 ${progress === 100 ? 'bg-green-500' : 'bg-primary-container'}`} style={{ width: `${progress}%` }}></div>
            </div>
            
            <div className="space-y-3">
              {tasks.map(task => (
                <label key={task} onClick={() => handleToggle(channel.id, task)} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 flex items-center justify-center rounded border transition-colors ${channelState[task] ? 'bg-primary-container border-primary-container text-black' : 'border-white/20 group-hover:border-primary-container'}`}>
                    {channelState[task] && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                  </div>
                  <span className={`text-sm ${channelState[task] ? 'text-white/30 line-through' : 'text-white/80 group-hover:text-white'}`}>{task}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
