import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWasteSystem } from '../../context/WasteSystemContext';
import {
  Layers,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Calendar,
  ChevronRight,
  X,
  ShieldCheck,
  ClipboardList,
  Check,
  AlertCircle,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { Task, TaskStatus } from '../../types';

export const TasksMonitoringPage: React.FC = () => {
  const { tasks, updateTaskStatus, verifyTask } = useWasteSystem();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Status counts calculated from real data
  const assignedCount = tasks.filter((t) => t.status === 'ASSIGNED').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN PROGRESS' || t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const verifiedCount = tasks.filter((t) => t.status === 'VERIFIED').length;

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      (t.id || '').toLowerCase().includes(query) ||
      (t.dustbinId || t.bin_id || '').toLowerCase().includes(query) ||
      (t.workerName || t.assigned_worker_name || '').toLowerCase().includes(query) ||
      (t.ward || '').toLowerCase().includes(query) ||
      (t.area || t.location || '').toLowerCase().includes(query);

    const taskStatusNormalized = t.status === 'IN_PROGRESS' ? 'IN PROGRESS' : t.status;
    const matchesStatus =
      statusFilter === 'ALL' ||
      taskStatusNormalized === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCardFilterClick = (targetStatus: string) => {
    if (statusFilter === targetStatus) {
      setStatusFilter('ALL');
    } else {
      setStatusFilter(targetStatus);
    }
  };

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
    setActionSuccess(null);
    setActionError(null);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedTask(null), 250);
  };

  // Drawer quick status actions
  const handleUpdateStatus = (newStatus: TaskStatus) => {
    if (!selectedTask) return;
    try {
      updateTaskStatus(selectedTask.id, newStatus);
      setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
      setActionSuccess(`Task status transitioned to ${newStatus}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e: any) {
      setActionError(e.message || 'Failed to update status');
    }
  };

  const handleVerifyTask = (approved: boolean) => {
    if (!selectedTask) return;
    try {
      verifyTask(selectedTask.id, approved);
      setSelectedTask((prev) => (prev ? { ...prev, status: approved ? 'VERIFIED' : 'IN PROGRESS' } : null));
      setActionSuccess(approved ? 'Task verified and closed successfully' : 'Task rejected and returned to crew');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e: any) {
      setActionError(e.message || 'Failed to verify task');
    }
  };

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#EFF4FB] p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0.05 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* ================= 1. PAGE HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[#1689DF] font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#1689DF]" />
              <span>DISPATCH &amp; SLA TRACKER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#142B45] mt-1">
              Workforce Task Monitoring
            </h1>
            <p className="text-xs sm:text-sm text-[#526985] mt-1">
              End-to-end task lifecycle audit across field sanitation crews, assignments, and verified closures.
            </p>
          </div>

          <div className="self-start sm:self-auto shrink-0">
            <div className="px-3.5 py-1.5 rounded-xl bg-white border border-[#DCE6F0] font-mono text-xs text-[#526985] shadow-xs">
              TOTAL TASKS: <span className="font-bold text-[#142B45]">{tasks.length} LOGGED</span>
            </div>
          </div>
        </div>

        {/* ================= 2. FOUR TASK SUMMARY CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. ASSIGNED */}
          <div
            onClick={() => handleCardFilterClick('ASSIGNED')}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all duration-200 relative overflow-hidden cursor-pointer select-none ${
              statusFilter === 'ASSIGNED'
                ? 'border-[#1689DF] ring-2 ring-[#1689DF]/20 shadow-md'
                : 'border-[#DCE6F0] hover:border-[#1689DF]/50 hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-11 h-11 rounded-xl bg-[#EBF5FF] border border-[#CDE2F5] text-[#1689DF] flex items-center justify-center shrink-0 shadow-2xs">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#526985] uppercase tracking-wider">
                  ASSIGNED
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-[#142B45] mt-0.5 leading-none">
                  {assignedCount}
                </span>
              </div>
            </div>

            {/* Subtle curved background decoration */}
            <svg
              viewBox="0 0 160 80"
              className="absolute bottom-0 right-0 w-32 h-18 pointer-events-none select-none"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M10,75 C50,45 90,85 130,55 C145,45 155,60 160,55 L160,80 L10,80 Z"
                fill="#EBF5FF"
                fillOpacity="0.8"
              />
              <path
                d="M30,80 C70,60 110,80 150,65 L160,80 L30,80 Z"
                fill="#DBEAFE"
                fillOpacity="0.5"
              />
            </svg>
          </div>

          {/* 2. IN PROGRESS */}
          <div
            onClick={() => handleCardFilterClick('IN PROGRESS')}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all duration-200 relative overflow-hidden cursor-pointer select-none ${
              statusFilter === 'IN PROGRESS'
                ? 'border-[#F07818] ring-2 ring-[#F07818]/20 shadow-md'
                : 'border-[#DCE6F0] hover:border-[#F07818]/50 hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-11 h-11 rounded-xl bg-[#FFF7ED] border border-[#FDBA74] text-[#F07818] flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#526985] uppercase tracking-wider">
                  IN PROGRESS
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-[#142B45] mt-0.5 leading-none">
                  {inProgressCount}
                </span>
              </div>
            </div>

            <svg
              viewBox="0 0 160 80"
              className="absolute bottom-0 right-0 w-32 h-18 pointer-events-none select-none"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M10,75 C50,45 90,85 130,55 C145,45 155,60 160,55 L160,80 L10,80 Z"
                fill="#FFF7ED"
                fillOpacity="0.8"
              />
              <path
                d="M30,80 C70,60 110,80 150,65 L160,80 L30,80 Z"
                fill="#FED7AA"
                fillOpacity="0.5"
              />
            </svg>
          </div>

          {/* 3. COMPLETED PROOFS */}
          <div
            onClick={() => handleCardFilterClick('COMPLETED')}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all duration-200 relative overflow-hidden cursor-pointer select-none ${
              statusFilter === 'COMPLETED'
                ? 'border-[#16A66A] ring-2 ring-[#16A66A]/20 shadow-md'
                : 'border-[#DCE6F0] hover:border-[#16A66A]/50 hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-11 h-11 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A66A] flex items-center justify-center shrink-0 shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#526985] uppercase tracking-wider">
                  COMPLETED PROOFS
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-[#142B45] mt-0.5 leading-none">
                  {completedCount}
                </span>
              </div>
            </div>

            <svg
              viewBox="0 0 160 80"
              className="absolute bottom-0 right-0 w-32 h-18 pointer-events-none select-none"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M10,75 C50,45 90,85 130,55 C145,45 155,60 160,55 L160,80 L10,80 Z"
                fill="#F0FDF4"
                fillOpacity="0.8"
              />
              <path
                d="M30,80 C70,60 110,80 150,65 L160,80 L30,80 Z"
                fill="#BBF7D0"
                fillOpacity="0.5"
              />
            </svg>
          </div>

          {/* 4. VERIFIED & CLOSED */}
          <div
            onClick={() => handleCardFilterClick('VERIFIED')}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all duration-200 relative overflow-hidden cursor-pointer select-none ${
              statusFilter === 'VERIFIED'
                ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/20 shadow-md'
                : 'border-[#DCE6F0] hover:border-[#7C3AED]/50 hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-11 h-11 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#526985] uppercase tracking-wider">
                  VERIFIED &amp; CLOSED
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-[#142B45] mt-0.5 leading-none">
                  {verifiedCount}
                </span>
              </div>
            </div>

            <svg
              viewBox="0 0 160 80"
              className="absolute bottom-0 right-0 w-32 h-18 pointer-events-none select-none"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M10,75 C50,45 90,85 130,55 C145,45 155,60 160,55 L160,80 L10,80 Z"
                fill="#F5F3FF"
                fillOpacity="0.8"
              />
              <path
                d="M30,80 C70,60 110,80 150,65 L160,80 L30,80 Z"
                fill="#E9D5FF"
                fillOpacity="0.5"
              />
            </svg>
          </div>
        </div>

        {/* ================= 3. SEARCH AND STATUS FILTERS ================= */}
        <div className="bg-white rounded-2xl border border-[#DCE6F0] p-2 sm:p-2.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 flex items-center pl-3">
            <Search className="w-4 h-4 text-[#8192A8] shrink-0" />
            <input
              type="text"
              placeholder="Search task ID, dustbin, worker name, or ward..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent pl-2.5 pr-4 py-1.5 text-xs text-[#142B45] placeholder-[#8192A8] outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 rounded text-[#8192A8] hover:text-[#142B45] mr-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Compact Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto p-0.5 shrink-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ASSIGNED', label: 'Assigned' },
              { id: 'IN PROGRESS', label: 'In Progress' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'VERIFIED', label: 'Verified' },
            ].map((f) => {
              const isActive = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[#1689DF] active:scale-[0.98] ${
                    isActive
                      ? 'bg-[#142B45] text-white shadow-xs'
                      : 'bg-white hover:bg-[#F8FAFC] text-[#526985] hover:text-[#142B45]'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= 4. TASK LIST ROWS ================= */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#DCE6F0] p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-[#F0F5FB] flex items-center justify-center text-[#1689DF]">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#142B45]">No tasks match your criteria</h3>
              <p className="text-xs text-[#526985] max-w-sm">
                Try adjusting your search query or status filter to see other sanitation tasks.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#1689DF] hover:text-[#0876C5] bg-[#F0F5FB] rounded-xl cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const priority = (task.priority || 'NORMAL').toUpperCase();
              const isCritical = priority === 'CRITICAL';
              const isHigh = priority === 'HIGH';

              const beforeFill = task.beforeFill ?? task.before_fill_percent ?? 90;
              const afterFill = task.afterFill ?? task.after_fill_percent;

              const statusNormalized = task.status === 'IN_PROGRESS' ? 'IN PROGRESS' : task.status;

              // Progress gauge color
              const ringColor = beforeFill >= 90 ? '#E54855' : beforeFill >= 80 ? '#F07818' : '#16A66A';
              const dotColor = beforeFill >= 90 ? 'bg-[#E54855]' : beforeFill >= 80 ? 'bg-[#F07818]' : 'bg-[#16A66A]';
              const fillTextColor = beforeFill >= 90 ? 'text-[#E54855]' : beforeFill >= 80 ? 'text-[#F07818]' : 'text-[#16A66A]';

              return (
                <div
                  key={task.id}
                  onClick={() => handleOpenTask(task)}
                  className="bg-white rounded-2xl border border-[#DCE6F0] p-4 sm:px-6 sm:py-3.5 shadow-xs hover:shadow-md hover:border-[#1689DF]/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
                >
                  {/* Left Cluster: Task ID, Location, Worker, Priority */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 flex-1 min-w-0">
                    {/* 1. Task ID & Dustbin ID */}
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <div className="w-9 h-9 rounded-xl bg-[#EBF5FF] border border-[#CDE2F5] text-[#1689DF] flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-[#1689DF] group-hover:text-white transition-colors">
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs sm:text-sm text-[#142B45] font-mono tracking-tight">
                          {task.id}
                        </span>
                        <span className="text-xs text-[#526985] font-mono">
                          {task.dustbinId || task.bin_id || 'D-101'}
                        </span>
                      </div>
                    </div>

                    {/* 2. Location & Ward */}
                    <div className="flex items-center gap-2.5 min-w-[150px]">
                      <MapPin className="w-4 h-4 text-[#8192A8] shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs sm:text-sm text-[#142B45] truncate">
                          {task.area || task.location || 'Municipal Sector'}
                        </span>
                        <span className="text-xs text-[#526985]">
                          {task.ward || 'Ward 01'}
                        </span>
                      </div>
                    </div>

                    {/* 3. Assigned Worker */}
                    <div className="flex items-center gap-2.5 min-w-[140px]">
                      <User className="w-4 h-4 text-[#8192A8] shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs sm:text-sm text-[#142B45]">
                          {task.workerName || task.assigned_worker_name || 'Sanitation Staff'}
                        </span>
                        <span className="text-[11px] font-mono text-[#526985]">
                          {task.assignedToWorkerId || task.assigned_worker_id || 'WKR-01'}
                        </span>
                      </div>
                    </div>

                    {/* 4. Priority Badge */}
                    <div className="shrink-0">
                      <span
                        className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                          isCritical
                            ? 'bg-[#FEF2F2] text-[#E54855] border border-[#FCA5A5]'
                            : isHigh
                            ? 'bg-[#FFF7ED] text-[#F07818] border border-[#FDBA74]'
                            : 'bg-[#F0FDF4] text-[#16A66A] border border-[#86EFAC]'
                        }`}
                      >
                        {priority}
                      </span>
                    </div>
                  </div>

                  {/* Right Cluster: Time/Deadline, Clearance Ring, Status, Action */}
                  <div className="flex items-center justify-between lg:justify-end gap-4 sm:gap-6 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#F1F5F9]">
                    {/* 5. Assigned Time & Deadline */}
                    <div className="flex items-center gap-2 text-right">
                      <Calendar className="w-4 h-4 text-[#8192A8] shrink-0" />
                      <div className="flex flex-col font-mono text-xs">
                        <span className="font-bold text-[#142B45]">
                          {task.assignedAt || '12:30'}
                        </span>
                        <span className="text-[#526985] text-[11px]">
                          {task.deadline || '13:00'}
                        </span>
                      </div>
                    </div>

                    {/* 6. Clearance % Circular Ring Gauge */}
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="2.5" />
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            fill="none"
                            stroke={ringColor}
                            strokeWidth="2.5"
                            strokeDasharray="88"
                            strokeDashoffset={88 - (88 * Math.min(beforeFill, 100)) / 100}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold font-mono ${fillTextColor}`}>
                          {beforeFill}%
                        </span>
                        {afterFill !== undefined && (
                          <span className="text-[10px] font-bold text-[#16A66A] font-mono">
                            &darr; {afterFill}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 7. Task Status Badge */}
                    <div className="w-[115px] flex justify-center shrink-0">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider text-center w-full ${
                          statusNormalized === 'VERIFIED'
                            ? 'bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]'
                            : statusNormalized === 'COMPLETED'
                            ? 'bg-[#F0FDF4] text-[#16A66A] border border-[#BBF7D0]'
                            : statusNormalized === 'IN PROGRESS'
                            ? 'bg-[#FFF7ED] text-[#F07818] border border-[#FDBA74]'
                            : 'bg-[#EBF5FF] text-[#1689DF] border border-[#CDE2F5]'
                        }`}
                      >
                        {statusNormalized}
                      </span>
                    </div>

                    {/* 8. Action Arrow Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTask(task);
                      }}
                      className="w-8 h-8 rounded-xl bg-[#F0F5FB] hover:bg-[#EBF5FF] text-[#1689DF] border border-[#DCE6F0] flex items-center justify-center transition-colors cursor-pointer shrink-0 group-hover:border-[#1689DF]"
                      title="View Task Drawer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* ================= 5. RIGHT-SIDE TASK DETAILS DRAWER ================= */}
      <AnimatePresence>
        {drawerOpen && selectedTask && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleCloseDrawer}
              className="absolute inset-0 bg-[#0F172A]/30 backdrop-blur-2xs cursor-pointer"
            />

            {/* Sliding Drawer Panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0.05 : 0.26,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative z-10 w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#E2EEF9] flex items-start justify-between bg-[#F8FAFC]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-[#142B45]">
                      {selectedTask.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        selectedTask.status === 'VERIFIED'
                          ? 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]'
                          : selectedTask.status === 'COMPLETED'
                          ? 'bg-[#F0FDF4] text-[#16A66A] border-[#BBF7D0]'
                          : selectedTask.status === 'IN PROGRESS' || selectedTask.status === 'IN_PROGRESS'
                          ? 'bg-[#FFF7ED] text-[#F07818] border-[#FDBA74]'
                          : 'bg-[#EBF5FF] text-[#1689DF] border-[#CDE2F5]'
                      }`}
                    >
                      {selectedTask.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#526985]">
                    Dustbin: <span className="font-mono font-bold text-[#142B45]">{selectedTask.dustbinId || selectedTask.bin_id || 'D-101'}</span> &bull; {selectedTask.area || selectedTask.location || 'Ward Sector'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-[#526985] hover:text-[#142B45] transition-colors cursor-pointer"
                  title="Close Drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
                {/* Action Feedback alerts */}
                {actionSuccess && (
                  <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A66A] font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{actionSuccess}</span>
                  </div>
                )}
                {actionError && (
                  <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#E54855] font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                      Priority Level
                    </span>
                    <span
                      className={`inline-block font-mono text-xs font-bold px-2 py-0.5 rounded ${
                        selectedTask.priority === 'CRITICAL'
                          ? 'bg-[#FEF2F2] text-[#E54855]'
                          : selectedTask.priority === 'HIGH'
                          ? 'bg-[#FFF7ED] text-[#F07818]'
                          : 'bg-[#F0FDF4] text-[#16A66A]'
                      }`}
                    >
                      {selectedTask.priority || 'NORMAL'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                      Assigned Worker
                    </span>
                    <span className="font-bold text-[#142B45] block">
                      {selectedTask.workerName || selectedTask.assigned_worker_name || 'Sanitation Staff'}
                    </span>
                    <span className="text-[11px] font-mono text-[#526985] block">
                      ID: {selectedTask.assignedToWorkerId || selectedTask.assigned_worker_id || 'WKR-01'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                      Assigned Time
                    </span>
                    <span className="font-mono font-bold text-[#142B45] block">
                      {selectedTask.assignedAt || '12:31'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                      Deadline / SLA
                    </span>
                    <span className="font-mono font-bold text-[#E54855] block">
                      {selectedTask.deadline || '13:00'}
                    </span>
                  </div>
                </div>

                {/* Fill Clearance Breakdown */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">
                    Capacity &amp; Clearance Verification
                  </span>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#526985]">Initial Fill Before Clearance:</span>
                    <span className="font-bold text-[#E54855]">{selectedTask.beforeFill ?? 90}%</span>
                  </div>
                  {selectedTask.afterFill !== undefined && (
                    <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-[#E2E8F0]">
                      <span className="text-[#526985]">Cleared Post-Service Fill:</span>
                      <span className="font-bold text-[#16A66A]">{selectedTask.afterFill}% (Verified)</span>
                    </div>
                  )}
                </div>

                {/* Proof of Completion (Photo / Notes) */}
                {selectedTask.proof?.completionPhoto || selectedTask.completion_photo ? (
                  <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-2">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">
                      Worker Completion Proof Photo
                    </span>
                    <div className="rounded-lg overflow-hidden border border-[#DCE6F0] max-h-48 bg-slate-100 flex items-center justify-center">
                      <img
                        src={selectedTask.proof?.completionPhoto || selectedTask.completion_photo}
                        alt="Completion Proof"
                        className="w-full h-auto object-cover max-h-48"
                      />
                    </div>
                    {selectedTask.proof?.timestamp && (
                      <span className="text-[10px] text-[#64748B] block font-mono">
                        Captured at: {selectedTask.proof.timestamp}
                      </span>
                    )}
                  </div>
                ) : null}

                {/* Lifecycle Operations / Status Transitions */}
                <div className="p-4 rounded-xl bg-[#F0F5FB] border border-[#DCE6F0] space-y-2.5">
                  <span className="text-[10px] uppercase font-bold text-[#1689DF] tracking-wider block">
                    Workflow Lifecycle Controls
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.status === 'ASSIGNED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('IN PROGRESS')}
                        className="px-3 py-1.5 rounded-lg bg-[#F07818] hover:bg-[#EA580C] text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Start Task (In Progress)
                      </button>
                    )}

                    {(selectedTask.status === 'IN PROGRESS' || selectedTask.status === 'IN_PROGRESS') && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('COMPLETED')}
                        className="px-3 py-1.5 rounded-lg bg-[#16A66A] hover:bg-[#15803D] text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Mark as Completed
                      </button>
                    )}

                    {selectedTask.status === 'COMPLETED' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleVerifyTask(true)}
                          className="px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verify &amp; Close Task</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerifyTask(false)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-[#E54855] text-[#E54855] hover:bg-[#FEF2F2] font-bold text-xs cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {selectedTask.status === 'VERIFIED' && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED]">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Task verified and closed. All SLA requirements satisfied.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-[#E2EEF9] bg-[#F8FAFC] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/worker/tasks/${selectedTask.id}`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DCE6F0] text-xs font-bold text-[#142B45] hover:border-[#1689DF] hover:text-[#1689DF] shadow-2xs transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Full Task Page</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="px-4 py-2 rounded-xl bg-[#142B45] hover:bg-[#0F172A] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
