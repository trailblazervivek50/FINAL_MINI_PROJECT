import React from 'react';
import { useWasteSystem } from '../../context/WasteSystemContext';
import { Link } from 'react-router-dom';
import { CheckSquare, Users, AlertCircle, ArrowRight, HardHat, Clock } from 'lucide-react';
import { STATUS_COLORS } from '../../config/thresholds';

export const SupervisorOperationsPage: React.FC = () => {
  const { tasks, workers, reports } = useWasteSystem();

  const pendingVerification = tasks.filter((t) => t.status === 'COMPLETED');
  const activeInField = tasks.filter((t) => t.status === 'IN PROGRESS' || t.status === 'ACCEPTED');
  const totalVerifiedToday = tasks.filter((t) => t.status === 'VERIFIED').length + 8;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-[rgba(26,26,24,0.15)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-[#6E6B64] flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-[#2F4B7C]" />
            <span>FIELD OPERATIONS DESK &bull; WARD 05</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A18] mt-1">
            Supervisor Operations
          </h1>
          <p className="text-sm text-[#6E6B64] mt-1 font-sans">
            Shift dispatching, crew oversight, and evidence verification for Ward 05 municipal sector.
          </p>
        </div>

        <Link
          to="/supervisor/verification"
          className="px-4 py-2.5 rounded-lg bg-[#1A1A18] hover:bg-[#2F4B7C] text-[#F3F1EC] text-xs font-mono font-medium flex items-center gap-2 transition cursor-pointer self-start md:self-auto"
        >
          <span>Open Verification Queue ({pendingVerification.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Operational KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs">
        <div className="bg-[#E9E6DF] p-5 rounded-2xl border border-[rgba(26,26,24,0.15)]">
          <span className="text-[#6E6B64] uppercase block">AWAITING VERIFICATION</span>
          <span className="font-serif text-3xl sm:text-4xl font-bold text-[#A63D40] mt-1 block">
            {pendingVerification.length}
          </span>
          <span className="text-[11px] text-[#A63D40] font-semibold mt-1 block">
            Completed proofs ready for sign-off
          </span>
        </div>

        <div className="bg-[#E9E6DF] p-5 rounded-2xl border border-[rgba(26,26,24,0.15)]">
          <span className="text-[#6E6B64] uppercase block">IN PROGRESS ON-SITE</span>
          <span className="font-serif text-3xl sm:text-4xl font-bold text-[#2F4B7C] mt-1 block">
            {activeInField.length}
          </span>
          <span className="text-[11px] text-[#6E6B64] mt-1 block">
            Crews currently at bins
          </span>
        </div>

        <div className="bg-[#E9E6DF] p-5 rounded-2xl border border-[rgba(26,26,24,0.15)]">
          <span className="text-[#6E6B64] uppercase block">TOTAL VERIFIED TODAY</span>
          <span className="font-serif text-3xl sm:text-4xl font-bold text-[#5D7A62] mt-1 block">
            {totalVerifiedToday}
          </span>
          <span className="text-[11px] text-[#5D7A62] font-semibold mt-1 block">
            100% SLA compliance rate
          </span>
        </div>
      </div>

      {/* Active Workforce Roster */}
      <div className="bg-[#F3F1EC] rounded-2xl border border-[rgba(26,26,24,0.15)] p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(26,26,24,0.12)]">
          <h2 className="font-serif text-xl font-bold text-[#1A1A18] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2F4B7C]" />
            Ward 05 Sanitation Crew
          </h2>
          <Link
            to="/supervisor/workers"
            className="text-xs font-mono text-[#2F4B7C] hover:underline"
          >
            Manage Roster &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {workers.map((w) => (
            <div
              key={w.id}
              className="p-4 rounded-xl border border-[rgba(26,26,24,0.1)] bg-[#E9E6DF] flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#1A1A18]">{w.name}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#1A1A18] text-white">
                    {w.id}
                  </span>
                </div>
                <div className="text-xs text-[#6E6B64] mt-0.5">{w.phone} &bull; Rating: {w.rating}/5</div>
              </div>

              <div className="text-right font-mono text-xs">
                <span className="px-2 py-0.5 rounded bg-[#5D7A62]/15 text-[#5D7A62] font-bold block mb-1">
                  {w.status}
                </span>
                <span className="text-[#6E6B64]">{w.tasksCompletedToday} Cleared</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
