import React from 'react';
import { formatCurrency } from '../../../utils/format';

interface KPIProps {
  title: string;
  value: string | number;
  trend?: number; // percentage
  trendLabel?: string;
  icon?: string;
  inverseColors?: boolean; // If true, negative trend is good (e.g., cancellations)
  onClick?: () => void;
}

export function KPICard({ title, value, trend, trendLabel, icon, inverseColors, onClick }: KPIProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;
  const showGreen = inverseColors ? isNegative : isPositive;
  const showRed = inverseColors ? isPositive : isNegative;

  return (
    <div 
      className={`bg-[#131313] p-5 rounded-xl border border-white/5 flex flex-col justify-between transition-all duration-300 hover:border-white/20 ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-bold text-on-surface/50 tracking-widest uppercase">{title}</span>
        {icon && (
          <span className="material-symbols-outlined text-on-surface/30 text-xl">{icon}</span>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <span className="text-3xl font-black leading-none text-white">{value}</span>
      </div>

      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-1.5">
          <div className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${showGreen ? 'bg-green-500/10 text-green-500' : showRed ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-white/50'}`}>
            {isPositive ? '▲' : isNegative ? '▼' : '−'}
            <span className="ml-1">{Math.abs(trend).toFixed(1)}%</span>
          </div>
          {trendLabel && (
            <span className="text-[10px] text-on-surface/40 uppercase tracking-wide">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
