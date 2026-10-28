import React from 'react';
import { useWasteSystem } from '../../context/WasteSystemContext';
import { Users, Phone, Star, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SupervisorWorkersPage: React.FC = () => {
  const { workers } = useWasteSystem();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="pb-6 border-b border-[rgba(26,26,24,0.15)] mb-8 flex items-baseline justify-between">
        <div>
          <Link
            to="/supervisor"
            className="flex items-center gap-1.5 text-xs font-mono text-[#6E6B64] hover:text-[#1A1A18] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK TO SUPERVISOR OPERATIONS</span>
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A18]">
            Sanitation Workforce Roster
          </h1>
          <p className="text-sm text-[#6E6B64] mt-1 font-sans">
            Ward staff roster, live status, shift clearance totals, and contact directory.
          </p>
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workers.map((w) => (
          <div
            key={w.id}
            className="bg-[#E9E6DF] rounded-2xl border border-[rgba(26,26,24,0.15)] p-6 space-y-4 shadow-xs"
          >
            <div className="flex items-start justify-between pb-3 border-b border-[rgba(26,26,24,0.12)]">
              <div>
                <span className="font-mono text-xs font-bold text-[#6E6B64]">{w.id}</span>
                <h3 className="font-serif text-xl font-bold text-[#1A1A18] mt-0.5">{w.name}</h3>
                <div className="text-xs text-[#6E6B64] mt-0.5">{w.ward} Response Unit</div>
              </div>

              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#5D7A62]/15 text-[#5D7A62]">
                {w.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 font-mono text-xs bg-[#F3F1EC] p-3 rounded-xl border border-[rgba(26,26,24,0.08)]">
              <div>
                <span className="text-[#6E6B64] block">PHONE</span>
                <span className="font-bold text-[#1A1A18]">{w.phone}</span>
              </div>
              <div>
                <span className="text-[#6E6B64] block">CLEARED TODAY</span>
                <span className="font-bold text-[#5D7A62]">{w.tasksCompletedToday} Bins</span>
              </div>
              <div>
                <span className="text-[#6E6B64] block">FIELD RATING</span>
                <span className="font-bold text-[#1A1A18]">{w.rating} / 5.0</span>
              </div>
              <div>
                <span className="text-[#6E6B64] block">ACTIVE ASSIGNMENT</span>
                <span className="font-bold text-[#2F4B7C]">{w.activeTaskId || 'Idle / Ready'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
