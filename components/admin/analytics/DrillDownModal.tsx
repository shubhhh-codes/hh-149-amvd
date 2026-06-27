import React from 'react';
import { BookingData } from './AnalyticsEngine';
import { formatCurrency } from '../../../utils/format';

export function DrillDownModal({ isOpen, onClose, title, data }: { isOpen: boolean, onClose: () => void, title: string, data: BookingData[] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1c1b1b] rounded-xl border border-white/10 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl animate-enter">
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-sm text-on-surface/50">{data.length} records found</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="overflow-auto p-6 flex-1">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-on-surface/50 uppercase bg-white/5">
              <tr>
                <th className="px-4 py-3 rounded-l">ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Tickets</th>
                <th className="px-4 py-3 text-right rounded-r">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.map((b) => {
                const revenue = b.cart ? b.cart.reduce((s, i) => s + (i.price * i.units), 0) : ((b.numberOfTickets || 0) * 499);
                return (
                  <tr key={b._id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-xs">{b.bookingId}</td>
                    <td className="px-4 py-3">{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold ${b.status === 'approved' ? 'bg-green-500/10 text-green-500' : b.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{b.numberOfTickets}</td>
                    <td className="px-4 py-3 text-right font-bold text-primary-container">{formatCurrency(revenue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.length === 0 && (
            <div className="text-center py-12 text-on-surface/50">No data available for this selection.</div>
          )}
        </div>
      </div>
    </div>
  );
}
