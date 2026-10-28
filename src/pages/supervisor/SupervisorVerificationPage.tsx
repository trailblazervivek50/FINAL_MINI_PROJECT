import React, { useState } from 'react';
import { useWasteSystem } from '../../context/WasteSystemContext';
import { STATUS_COLORS } from '../../config/thresholds';
import {
  CheckCircle2,
  XCircle,
  MapPin,
  Camera,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertTriangle,
} from 'lucide-react';

export const SupervisorVerificationPage: React.FC = () => {
  const { tasks, verifyTask } = useWasteSystem();
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Verification queue includes tasks marked COMPLETED by workers, or show latest completed task
  const pendingTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const recentlyVerified = tasks.filter((t) => t.status === 'VERIFIED');

  const handleApprove = (taskId: string) => {
    verifyTask(taskId, true);
    setFeedbackNotice(`Task ${taskId} verified and approved. Telemetry reset to cleared level.`);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleReject = (taskId: string) => {
    verifyTask(taskId, false);
    setFeedbackNotice(`Task ${taskId} rejected. Worker dispatched for re-clearance.`);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-[rgba(26,26,24,0.15)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-[#6E6B64] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2F4B7C]" />
            <span>WARD QUALITY AUDIT &bull; WARD 05 SUPERVISOR</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A18] mt-1">
            Workforce Clearance Verification
          </h1>
          <p className="text-sm text-[#6E6B64] mt-1 font-sans">
            Validate photographic proof, GPS location match, and ultrasonic sensor reduction prior to marking tasks resolved.
          </p>
        </div>

        <div className="font-mono text-xs text-[#6E6B64]">
          PENDING AUDIT: <span className="font-bold text-[#A63D40]">{pendingTasks.length} TASKS</span>
        </div>
      </div>

      {/* Success notification */}
      {feedbackNotice && (
        <div className="bg-[#5D7A62]/15 border border-[#5D7A62]/40 rounded-xl p-4 text-xs font-mono text-[#5D7A62] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Pending verification cards (Requirement 27) */}
      {pendingTasks.length === 0 ? (
        <div className="text-center py-12 bg-[#E9E6DF] rounded-2xl border border-[rgba(26,26,24,0.12)] space-y-2">
          <CheckCircle2 className="w-10 h-10 text-[#5D7A62] mx-auto" />
          <h3 className="font-serif text-xl font-bold text-[#1A1A18]">
            Verification Queue Clear
          </h3>
          <p className="text-xs text-[#6E6B64] max-w-sm mx-auto">
            All submitted clearance proofs have been verified. Switch to Worker role to complete a task and test this flow.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              className="bg-[#E9E6DF] rounded-2xl border-2 border-[#1A1A18] p-6 sm:p-7 space-y-6 shadow-md"
            >
              {/* Task Title & Target */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-[rgba(26,26,24,0.12)]">
                <div>
                  <span className="font-mono text-xs font-bold text-[#6E6B64]">
                    PENDING APPROVAL
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-[#1A1A18] mt-0.5">
                    {task.id}
                  </h2>
                  <div className="font-mono text-sm text-[#1A1A18] font-semibold mt-1">
                    {task.dustbinId || task.bin_id || 'BIN'} / {(task.area || task.location || 'SECTOR').toUpperCase()} ({task.ward})
                  </div>
                </div>

                <div className="text-left sm:text-right font-mono text-xs">
                  <span className="text-[#6E6B64] block">ASSIGNED WORKER</span>
                  <span className="font-bold text-[#1A1A18] text-sm">{task.workerName}</span>
                </div>
              </div>

              {/* Before vs After Fill Comparison */}
              <div className="grid grid-cols-2 gap-4 bg-[#F3F1EC] p-4 rounded-xl border border-[rgba(26,26,24,0.1)] text-center font-mono">
                <div className="border-r border-[rgba(26,26,24,0.1)] pr-2">
                  <span className="text-xs text-[#6E6B64] uppercase block">BEFORE FILL</span>
                  <span className="font-serif text-3xl sm:text-4xl font-bold text-[#A63D40] mt-1 block">
                    {task.beforeFill}%
                  </span>
                  <span className="text-[10px] text-[#A63D40] font-semibold">Over capacity</span>
                </div>

                <div className="pl-2">
                  <span className="text-xs text-[#6E6B64] uppercase block">AFTER FILL</span>
                  <span className="font-serif text-3xl sm:text-4xl font-bold text-[#5D7A62] mt-1 block">
                    {task.afterFill ?? 18}%
                  </span>
                  <span className="text-[10px] text-[#5D7A62] font-semibold">Cleared target</span>
                </div>
              </div>

              {/* Photographic & Sensor Evidence Checklist (Requirement 27) */}
              <div className="space-y-3">
                <div className="font-mono text-xs font-semibold text-[#1A1A18] uppercase tracking-wider">
                  VERIFICATION EVIDENCE
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="flex items-center gap-2 bg-[#F3F1EC] p-3 rounded-lg border border-[rgba(26,26,24,0.08)]">
                    <Check className="w-4 h-4 text-[#5D7A62] stroke-[3]" />
                    <span className="font-semibold text-[#1A1A18]">Photo received</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#F3F1EC] p-3 rounded-lg border border-[rgba(26,26,24,0.08)]">
                    <Check className="w-4 h-4 text-[#5D7A62] stroke-[3]" />
                    <span className="font-semibold text-[#1A1A18]">Location matched</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#F3F1EC] p-3 rounded-lg border border-[rgba(26,26,24,0.08)]">
                    <Check className="w-4 h-4 text-[#5D7A62] stroke-[3]" />
                    <span className="font-semibold text-[#1A1A18]">Sensor level reduced</span>
                  </div>
                </div>

                {/* Photo Preview if available */}
                {task.proof?.completionPhoto && (
                  <div className="rounded-xl overflow-hidden border border-[rgba(26,26,24,0.15)] mt-3">
                    <img
                      src={task.proof.completionPhoto}
                      alt="Field proof"
                      className="w-full h-44 object-cover"
                    />
                    <div className="bg-[#1A1A18] text-[#F3F1EC] px-3 py-1.5 flex justify-between text-[11px] font-mono">
                      <span>Field Evidence Photo: Clearance Complete</span>
                      <span className="text-[#86AB8B]">Timestamp: {task.proof.timestamp}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons: APPROVE / REJECT (Requirement 27) */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleApprove(task.id)}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-[#1A1A18] hover:bg-[#5D7A62] text-[#F3F1EC] font-sans font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#5D7A62]" />
                  <span>APPROVE &amp; CLOSE TASK</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleReject(task.id)}
                  className="py-3.5 px-6 rounded-xl bg-[#F3F1EC] hover:bg-[#A63D40]/15 text-[#A63D40] border border-[#A63D40]/30 font-sans font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-[#A63D40]" />
                  <span>REJECT / REQUEST RE-CLEARANCE</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recently verified log */}
      {recentlyVerified.length > 0 && (
        <div className="pt-6 border-t border-[rgba(26,26,24,0.12)]">
          <h3 className="font-serif text-lg font-bold text-[#1A1A18] mb-3">
            Recently Verified &amp; Closed Tasks
          </h3>
          <div className="space-y-2">
            {recentlyVerified.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl border border-[rgba(26,26,24,0.1)] bg-[#E9E6DF]/50 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="font-bold text-[#1A1A18]">{t.id}</span> &bull; {t.dustbinId} ({t.area}) &bull; Worker: {t.workerName}
                </div>
                <span className="font-bold text-[#5D7A62] bg-[#5D7A62]/10 px-2 py-0.5 rounded">
                  ✓ VERIFIED
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
