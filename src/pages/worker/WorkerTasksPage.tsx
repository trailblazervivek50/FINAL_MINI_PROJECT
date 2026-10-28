import React, { useState } from 'react';
import { useWasteSystem } from '../../context/WasteSystemContext';
import { useNavigate, Link } from 'react-router-dom';
import { STATUS_COLORS } from '../../config/thresholds';
import { ArrowLeft, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';

export const WorkerTasksPage: React.FC = () => {
  const { tasks, workers } = useWasteSystem();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('ALL');

  const worker = workers.find((w) => w.id === 'WKR-01') || workers[0];
  const myTasks = tasks.filter((t) => t.assignedToWorkerId === worker.id);

  const filtered = myTasks.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[rgba(26,26,24,0.15)]">
        <div>
          <Link
            to="/worker"
            className="flex items-center gap-1.5 text-xs font-mono text-[#6E6B64] hover:text-[#1A1A18] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK TO DASHBOARD</span>
          </Link>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1A1A18]">
            My Shift Task Queue
          </h1>
          <p className="text-xs text-[#6E6B64] mt-1 font-sans">
            Assigned collections, active clearances, and verified completion history.
          </p>
        </div>

        <span className="font-mono text-xs font-bold text-[#1A1A18] bg-[#E9E6DF] px-3 py-1.5 rounded-lg border border-[rgba(26,26,24,0.1)]">
          {myTasks.length} Assigned
        </span>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center bg-[#E9E6DF] p-1 rounded-xl border border-[rgba(26,26,24,0.1)] text-xs font-mono">
        {(['ALL', 'ASSIGNED', 'IN PROGRESS', 'COMPLETED', 'VERIFIED'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
              filter === s
                ? 'bg-[#1A1A18] text-[#F3F1EC] font-semibold'
                : 'text-[#6E6B64] hover:text-[#1A1A18]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((t) => {
          const colors = STATUS_COLORS[(t.priority as any) || 'NORMAL'] || STATUS_COLORS.NORMAL;
          return (
            <div
              key={t.id}
              onClick={() => navigate(`/worker/tasks/${t.id}`)}
              className="p-5 rounded-2xl border border-[rgba(26,26,24,0.12)] bg-[#E9E6DF] hover:border-[#1A1A18] transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#1A1A18]">{t.id}</span>
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${colors.text} ${colors.bg}`}
                  >
                    {t.priority}
                  </span>
                </div>
                <div className="font-serif text-lg font-bold text-[#1A1A18]">
                  {t.dustbinId} &bull; {t.area}
                </div>
                <div className="font-mono text-xs text-[#6E6B64]">
                  Assigned: {t.assignedAt} &bull; Deadline: {t.deadline}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[rgba(26,26,24,0.1)]">
                <span
                  className={`font-mono text-xs font-bold px-2.5 py-1 rounded ${
                    t.status === 'VERIFIED'
                      ? 'bg-[#5D7A62] text-white'
                      : t.status === 'COMPLETED'
                      ? 'bg-[#B8892D] text-white'
                      : 'bg-[#1A1A18] text-[#F3F1EC]'
                  }`}
                >
                  {t.status}
                </span>

                <div className="p-2 rounded bg-[#1A1A18] text-white hover:bg-[#2F4B7C] transition">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
