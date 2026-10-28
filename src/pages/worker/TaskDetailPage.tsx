import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWasteSystem } from '../../context/WasteSystemContext';
import { STATUS_COLORS } from '../../config/thresholds';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Play,
  Upload,
  Camera,
  MapPin,
  AlertOctagon,
  ShieldAlert,
} from 'lucide-react';

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, updateTaskStatus, completeTaskWithProof } = useWasteSystem();

  const task = tasks.find((t) => t.id === id) || tasks[0];
  const priorityColors = STATUS_COLORS[(task.priority as any) || 'NORMAL'] || STATUS_COLORS.NORMAL;

  const [afterFill, setAfterFill] = useState<number>(15);
  const [proofPhoto, setProofPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80'
  );
  const [showProofModal, setShowProofModal] = useState(false);

  // State machine handlers (Requirement 25)
  const handleAccept = () => {
    updateTaskStatus(task.id, 'ACCEPTED');
  };

  const handleStart = () => {
    updateTaskStatus(task.id, 'IN PROGRESS');
  };

  const handleOpenCompleteModal = () => {
    setShowProofModal(true);
  };

  const handleConfirmCompletion = () => {
    completeTaskWithProof(task.id, proofPhoto, afterFill);
    setShowProofModal(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/worker')}
        className="flex items-center gap-1.5 text-xs font-mono text-[#6E6B64] hover:text-[#1A1A18] mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>BACK TO MY TASKS</span>
      </button>

      {/* Task Header */}
      <div className="bg-[#E9E6DF] rounded-2xl border border-[rgba(26,26,24,0.15)] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-start justify-between pb-4 border-b border-[rgba(26,26,24,0.12)]">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[#6E6B64]">
              FIELD WORKFORCE DISPATCH
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1A1A18] mt-1">
              {task.id}
            </h1>
            <div className="font-mono text-xs text-[#6E6B64] mt-0.5">
              Assigned to: <span className="font-bold text-[#1A1A18]">{task.workerName}</span>
            </div>
          </div>

          <span
            className={`font-mono text-xs font-bold px-2.5 py-1 rounded ${priorityColors.text} ${priorityColors.bg}`}
          >
            {task.priority}
          </span>
        </div>

        {/* Target Dustbin Info */}
        <div className="bg-[#F3F1EC] p-5 rounded-xl border border-[rgba(26,26,24,0.1)] space-y-3">
          <div className="flex justify-between items-baseline">
            <div>
              <span className="font-mono text-lg font-bold text-[#1A1A18]">
                {task.dustbinId}
              </span>
              <span className="text-xs text-[#6E6B64] ml-2">
                {task.area} &bull; {task.ward}
              </span>
            </div>
            <span className="font-mono text-sm font-bold text-[#A63D40]">
              {task.beforeFill}% Initial Fill
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 font-mono text-xs pt-2 border-t border-[rgba(26,26,24,0.08)]">
            <div>
              <span className="text-[#6E6B64] block">ASSIGNED AT:</span>
              <span className="font-bold text-[#1A1A18]">{task.assignedAt}</span>
            </div>
            <div>
              <span className="text-[#6E6B64] block">TARGET DEADLINE:</span>
              <span className="font-bold text-[#1A1A18]">{task.deadline}</span>
            </div>
          </div>

          {task.notes && (
            <div className="text-xs text-[#6E6B64] bg-[#E9E6DF] p-2.5 rounded-lg border border-[rgba(26,26,24,0.08)] font-sans">
              <span className="font-semibold text-[#1A1A18]">Instructions: </span>
              {task.notes}
            </div>
          )}
        </div>

        {/* State Machine Status Progression Bar */}
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-[#6E6B64] mb-3">
            TASK EXECUTION STAGE
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[11px]">
            <div
              className={`py-2 rounded ${
                task.status === 'ASSIGNED'
                  ? 'bg-[#1A1A18] text-[#F3F1EC] font-bold'
                  : 'bg-[#F3F1EC] text-[#6E6B64]'
              }`}
            >
              ASSIGNED
            </div>
            <div
              className={`py-2 rounded ${
                task.status === 'ACCEPTED'
                  ? 'bg-[#1A1A18] text-[#F3F1EC] font-bold'
                  : task.status === 'IN PROGRESS' || task.status === 'COMPLETED' || task.status === 'VERIFIED'
                  ? 'bg-[#5D7A62]/20 text-[#5D7A62] font-semibold'
                  : 'bg-[#F3F1EC] text-[#6E6B64]'
              }`}
            >
              ACCEPTED
            </div>
            <div
              className={`py-2 rounded ${
                task.status === 'IN PROGRESS'
                  ? 'bg-[#2F4B7C] text-white font-bold'
                  : task.status === 'COMPLETED' || task.status === 'VERIFIED'
                  ? 'bg-[#5D7A62]/20 text-[#5D7A62] font-semibold'
                  : 'bg-[#F3F1EC] text-[#6E6B64]'
              }`}
            >
              IN PROGRESS
            </div>
            <div
              className={`py-2 rounded ${
                task.status === 'COMPLETED'
                  ? 'bg-[#B8892D] text-white font-bold'
                  : task.status === 'VERIFIED'
                  ? 'bg-[#5D7A62] text-white font-bold'
                  : 'bg-[#F3F1EC] text-[#6E6B64]'
              }`}
            >
              {task.status === 'VERIFIED' ? 'VERIFIED' : 'PROOF SUBMITTED'}
            </div>
          </div>
        </div>

        {/* Functional Interactive State Action Buttons (Requirement 25) */}
        <div className="pt-2">
          {task.status === 'ASSIGNED' && (
            <button
              type="button"
              onClick={handleAccept}
              className="w-full py-3.5 rounded-xl bg-[#1A1A18] hover:bg-[#2F4B7C] text-[#F3F1EC] font-sans font-bold text-sm transition shadow-sm cursor-pointer"
            >
              ACCEPT TASK
            </button>
          )}

          {task.status === 'ACCEPTED' && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-[#5D7A62] font-semibold flex items-center justify-center gap-1.5 bg-[#5D7A62]/10 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                <span>TASK ACCEPTED &mdash; READY FOR FIELD COMMENCEMENT</span>
              </div>
              <button
                type="button"
                onClick={handleStart}
                className="w-full py-3.5 rounded-xl bg-[#2F4B7C] hover:bg-[#1A1A18] text-[#F3F1EC] font-sans font-bold text-sm transition shadow-sm cursor-pointer"
              >
                START TASK (COMMENCE CLEARANCE)
              </button>
            </div>
          )}

          {task.status === 'IN PROGRESS' && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-[#2F4B7C] font-semibold flex items-center justify-center gap-1.5 bg-[#2F4B7C]/10 py-2 rounded-lg">
                <Clock className="w-4 h-4 animate-spin" />
                <span>CREW ON SITE &bull; CLEARANCE IN PROGRESS</span>
              </div>
              <button
                type="button"
                onClick={handleOpenCompleteModal}
                className="w-full py-3.5 rounded-xl bg-[#1A1A18] hover:bg-[#5D7A62] text-[#F3F1EC] font-sans font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>COMPLETE TASK &amp; SUBMIT PROOF</span>
              </button>
            </div>
          )}

          {task.status === 'COMPLETED' && (
            <div className="bg-[#5D7A62]/15 border border-[#5D7A62]/30 p-4 rounded-xl text-center space-y-2">
              <div className="text-xs font-mono text-[#5D7A62] font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ SUBMITTED FOR SUPERVISOR VERIFICATION</span>
              </div>
              <p className="text-xs text-[#6E6B64]">
                Completion photo and clearance telemetry uploaded. Awaiting supervisor sign-off.
              </p>
              {task.proof && (
                <div className="pt-2">
                  <img
                    src={task.proof.completionPhoto}
                    alt="Proof"
                    className="w-full h-36 object-cover rounded-lg border border-[rgba(26,26,24,0.1)]"
                  />
                  <div className="font-mono text-[11px] text-[#6E6B64] mt-1">
                    Recorded Level: {task.proof.afterFill}% (Reduced from {task.beforeFill}%)
                  </div>
                </div>
              )}
            </div>
          )}

          {task.status === 'VERIFIED' && (
            <div className="bg-[#5D7A62] text-white p-4 rounded-xl text-center space-y-1">
              <div className="font-mono text-sm font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>TASK OFFICIALLY VERIFIED &amp; CLOSED</span>
              </div>
              <p className="text-xs text-white/80">
                Supervisor confirmed clearance. Waste pressure reduced in sector.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Proof Submission Modal (Requirement 26) */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 bg-[#1A1A18]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F3F1EC] border border-[rgba(26,26,24,0.2)] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="border-b border-[rgba(26,26,24,0.12)] pb-3">
              <div className="font-mono text-xs uppercase tracking-wider text-[#6E6B64]">
                VERIFICATION EVIDENCE
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1A1A18]">
                Provide Completion Proof
              </h3>
            </div>

            {/* Proof photo */}
            <div>
              <label className="font-mono text-xs font-semibold text-[#1A1A18] block mb-2 uppercase">
                Completion Photo:
              </label>
              <div className="rounded-xl overflow-hidden border border-[rgba(26,26,24,0.2)] mb-2">
                <img src={proofPhoto} alt="Cleaned Bin" className="w-full h-40 object-cover" />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setProofPhoto(
                      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80'
                    )
                  }
                  className="px-2.5 py-1 rounded bg-[#E9E6DF] hover:bg-[#1A1A18] hover:text-white text-[11px] font-mono transition"
                >
                  Empty Bin Photo 1
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setProofPhoto(
                      'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=600&auto=format&fit=crop&q=80'
                    )
                  }
                  className="px-2.5 py-1 rounded bg-[#E9E6DF] hover:bg-[#1A1A18] hover:text-white text-[11px] font-mono transition"
                >
                  Empty Bin Photo 2
                </button>
              </div>
            </div>

            {/* Post-clearance fill % slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-mono text-xs font-semibold text-[#1A1A18] uppercase">
                  Residual Level After Emptying:
                </label>
                <span className="font-mono text-sm font-bold text-[#5D7A62]">
                  {afterFill}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={afterFill}
                onChange={(e) => setAfterFill(Number(e.target.value))}
                className="w-full accent-[#5D7A62] cursor-pointer"
              />
              <div className="flex justify-between font-mono text-[10px] text-[#6E6B64]">
                <span>0% Completely Empty</span>
                <span>30% Base Tare</span>
              </div>
            </div>

            <div className="bg-[#E9E6DF] p-2.5 rounded-lg text-[11px] font-mono text-[#6E6B64] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#2F4B7C]" />
              <span>Location Geotag: 18.5204° N, 73.8567° E (Ward 05 Matched)</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowProofModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[rgba(26,26,24,0.15)] bg-[#E9E6DF] hover:bg-[#DDD9D0] text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCompletion}
                className="flex-1 py-2.5 rounded-xl bg-[#1A1A18] hover:bg-[#5D7A62] text-[#F3F1EC] text-xs font-semibold cursor-pointer transition"
              >
                Submit Evidence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
