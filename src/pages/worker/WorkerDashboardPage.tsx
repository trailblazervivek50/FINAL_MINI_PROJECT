import React from 'react';
import { useWasteSystem } from '../../context/WasteSystemContext';
import { useNavigate, Link } from 'react-router-dom';
import { HardHat, Clock, CheckCircle2, AlertOctagon, ArrowRight, ShieldAlert } from 'lucide-react';
import { STATUS_COLORS } from '../../config/thresholds';

export const WorkerDashboardPage: React.FC = () => {
  const { tasks, workers } = useWasteSystem();
  const navigate = useNavigate();

  // Active worker Rahul Patil (WKR-01)
  const worker = workers.find((w) => w.id === 'WKR-01') || workers[0];
  const myTasks = tasks.filter((t) => t.assignedToWorkerId === worker.id);
  const activeTask = myTasks.find((t) => t.status !== 'VERIFIED');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Editorial Operational Worker Header (Requirement 24) */}
      <div className="flex items-center justify-between pb-4 border-b border-[rgba(26,26,24,0.15)]">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-[#6E6B64] flex items-center gap-1.5">
            <HardHat className="w-3.5 h-3.5 text-[#2F4B7C]" />
            <span>FIELD SANITATION FORCE &bull; WARD 05</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1A1A18] mt-0.5">
            {worker.name}
          </h1>
          <div className="font-mono text-xs text-[#6E6B64] mt-0.5">
            ID: <span className="font-bold text-[#1A1A18]">{worker.id}</span> &bull; Sector: {worker.ward}
          </div>
        </div>

        <div className="text-right">
          <span className="font-mono text-[10px] text-[#6E6B64] block">SHIFT STATUS</span>
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#5D7A62]/15 text-[#5D7A62] border border-[#5D7A62]/30 inline-block mt-0.5">
            ● ON DUTY
          </span>
        </div>
      </div>

      {/* Operational Summary Strip */}
      <div className="grid grid-cols-3 gap-3 font-mono text-xs">
        <div className="bg-[#E9E6DF] p-3.5 rounded-xl border border-[rgba(26,26,24,0.12)]">
          <span className="text-[10px] text-[#6E6B64] uppercase block">ACTIVE ASSIGNMENTS</span>
          <span className="font-serif text-2xl font-bold text-[#1A1A18] mt-1 block">
            {myTasks.filter((t) => t.status !== 'VERIFIED').length}
          </span>
        </div>
        <div className="bg-[#E9E6DF] p-3.5 rounded-xl border border-[rgba(26,26,24,0.12)]">
          <span className="text-[10px] text-[#6E6B64] uppercase block">CLEARED TODAY</span>
          <span className="font-serif text-2xl font-bold text-[#5D7A62] mt-1 block">
            {worker.tasksCompletedToday}
          </span>
        </div>
        <div className="bg-[#E9E6DF] p-3.5 rounded-xl border border-[rgba(26,26,24,0.12)]">
          <span className="text-[10px] text-[#6E6B64] uppercase block">FIELD RATING</span>
          <span className="font-serif text-2xl font-bold text-[#1A1A18] mt-1 block">
            {worker.rating} / 5
          </span>
        </div>
      </div>

      {/* Primary Active Task Banner (Requirement 24 Format) */}
      {activeTask ? (
        <div className="bg-[#1A1A18] text-[#F3F1EC] rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#333]">
            <div className="font-mono text-xs text-[#B8892D] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-[#A63D40]" />
              <span>01 / CRITICAL ACTION REQUIRED</span>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#2D2D2A] text-[#F3F1EC] font-bold">
              {activeTask.status}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <div className="font-mono text-2xl font-bold tracking-tight">
                {activeTask.dustbinId}
              </div>
              <div className="font-mono text-xs uppercase tracking-wider text-[#A8A49D] mt-0.5">
                {activeTask.area} &bull; {activeTask.ward}
              </div>
            </div>

            <div className="font-serif text-3xl font-bold text-[#E07A7C]">
              {activeTask.beforeFill}% FULL
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 font-mono text-xs bg-[#242422] p-3.5 rounded-xl border border-[#383834]">
            <div>
              <span className="text-[#888] block text-[10px]">ASSIGNED:</span>
              <span className="font-bold text-white">{activeTask.assignedAt}</span>
            </div>
            <div>
              <span className="text-[#888] block text-[10px]">DEADLINE:</span>
              <span className="font-bold text-[#E07A7C]">{activeTask.deadline}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/worker/tasks/${activeTask.id}`)}
            className="w-full py-3.5 px-4 rounded-xl bg-[#F3F1EC] hover:bg-[#E9E6DF] text-[#1A1A18] font-sans font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>OPEN TASK EXECUTION</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="p-8 text-center bg-[#E9E6DF] rounded-2xl border border-[rgba(26,26,24,0.12)]">
          <CheckCircle2 className="w-10 h-10 text-[#5D7A62] mx-auto mb-2" />
          <h3 className="font-serif text-lg font-bold text-[#1A1A18]">All Tasks Complete!</h3>
          <p className="text-xs text-[#6E6B64] mt-1">No pending collections in your ward right now.</p>
        </div>
      )}

      {/* Full Task List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between pb-2 border-b border-[rgba(26,26,24,0.12)]">
          <h2 className="font-serif text-lg font-bold text-[#1A1A18]">
            Today&apos;s Shift Queue ({myTasks.length})
          </h2>
          <span className="font-mono text-xs text-[#6E6B64]">WARD 05</span>
        </div>

        {myTasks.map((t) => {
          const colors = STATUS_COLORS[(t.priority as any) || 'NORMAL'] || STATUS_COLORS.NORMAL;
          return (
            <div
              key={t.id}
              onClick={() => navigate(`/worker/tasks/${t.id}`)}
              className="p-4 rounded-xl border border-[rgba(26,26,24,0.12)] bg-[#E9E6DF]/60 hover:bg-[#E9E6DF] hover:border-[#1A1A18] transition cursor-pointer flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#1A1A18]">{t.id}</span>
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${colors.text} ${colors.bg}`}>
                    {t.priority}
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#1A1A18]">{t.dustbinId} &bull; {t.area}</div>
                <div className="font-mono text-[10px] text-[#6E6B64]">Deadline: {t.deadline}</div>
              </div>

              <div className="text-right">
                <span
                  className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                    t.status === 'VERIFIED'
                      ? 'bg-[#5D7A62] text-white'
                      : t.status === 'COMPLETED'
                      ? 'bg-[#B8892D] text-white'
                      : 'bg-[#1A1A18] text-[#F3F1EC]'
                  }`}
                >
                  {t.status}
                </span>
                <div className="text-[10px] font-mono text-[#2F4B7C] mt-1 flex items-center justify-end gap-1">
                  <span>Manage</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
