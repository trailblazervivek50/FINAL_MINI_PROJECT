import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useMunicipal } from '../../context/MunicipalContext';
import { useWasteSystem } from '../../context/WasteSystemContext';
import {
  Users,
  Search,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  X,
  Phone,
  Calendar,
  Clock,
  ExternalLink,
  ShieldCheck,
  Star,
  Check,
  RotateCcw,
  UserCheck,
  Layers,
  User as UserIcon
} from 'lucide-react';
import { Worker } from '../../types';

export const WorkersPage: React.FC = () => {
  const { workers: municipalWorkers, tasks: municipalTasks } = useMunicipal();
  const { workers: fallbackWorkers, tasks: fallbackTasks } = useWasteSystem();

  // Prefer backend data from MunicipalContext, fallback to WasteSystemContext
  const rawWorkers = useMemo(() => {
    if (municipalWorkers && municipalWorkers.length > 0) return municipalWorkers;
    return fallbackWorkers || [];
  }, [municipalWorkers, fallbackWorkers]);

  const rawTasks = useMemo(() => {
    if (municipalTasks && municipalTasks.length > 0) return municipalTasks;
    return fallbackTasks || [];
  }, [municipalTasks, fallbackTasks]);

  // Local state for worker status updates
  const [workerStatusOverrides, setWorkerStatusOverrides] = useState<Record<string, string>>({});

  const workers = useMemo(() => {
    return rawWorkers.map((w) => {
      const override = workerStatusOverrides[w.id];
      if (override) {
        return { ...w, status: override };
      }
      return w;
    });
  }, [rawWorkers, workerStatusOverrides]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // 'ALL' | 'ON DUTY' | 'BUSY' | 'AVAILABLE'

  // Drawer
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedWorker = useMemo(() => {
    if (!selectedWorkerId) return null;
    return workers.find((w) => w.id === selectedWorkerId) || null;
  }, [selectedWorkerId, workers]);

  // Normalize worker status
  const normalizeStatus = (status?: string): string => {
    const s = String(status || '').toUpperCase().replace('_', ' ');
    if (s.includes('DUTY')) return 'ON DUTY';
    if (s.includes('BREAK')) return 'ON BREAK';
    if (s.includes('BUSY')) return 'BUSY';
    return s || 'ON DUTY';
  };

  // Find active task for a worker
  const getActiveTask = (workerId: string) => {
    return rawTasks.find(
      (t) =>
        (t.assigned_worker_id === workerId || t.assignedToWorkerId === workerId) &&
        t.status !== 'VERIFIED' &&
        t.status !== 'COMPLETED'
    );
  };

  // Status counts
  const onDutyCount = workers.filter((w) => normalizeStatus(w.status) === 'ON DUTY').length;
  const busyCount = workers.filter((w) => {
    const s = normalizeStatus(w.status);
    return s === 'BUSY' || !!getActiveTask(w.id);
  }).length;
  const availableCount = workers.filter((w) => {
    const s = normalizeStatus(w.status);
    return s === 'ON DUTY' && !getActiveTask(w.id);
  }).length;

  // Filtered workers list
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const normStatus = normalizeStatus(w.status);
      const activeTask = getActiveTask(w.id);
      const isAvailable = normStatus === 'ON DUTY' && !activeTask;

      // Search matching name, ID, ward
      const q = searchTerm.toLowerCase().trim();
      if (q) {
        const matchesName = (w.name || '').toLowerCase().includes(q);
        const matchesId = (w.id || '').toLowerCase().includes(q);
        const matchesWard = (w.ward || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesWard) return false;
      }

      // Status Filter
      if (statusFilter === 'ON DUTY') {
        if (normStatus !== 'ON DUTY') return false;
      } else if (statusFilter === 'BUSY') {
        if (normStatus !== 'BUSY' && !activeTask) return false;
      } else if (statusFilter === 'AVAILABLE') {
        if (!isAvailable) return false;
      }

      return true;
    });
  }, [workers, rawTasks, searchTerm, statusFilter]);

  // Worker detail tasks history
  const workerTaskHistory = useMemo(() => {
    if (!selectedWorkerId) return [];
    return rawTasks.filter(
      (t) => t.assigned_worker_id === selectedWorkerId || t.assignedToWorkerId === selectedWorkerId
    );
  }, [selectedWorkerId, rawTasks]);

  // Open worker drawer
  const handleOpenWorker = (worker: Worker) => {
    setSelectedWorkerId(worker.id);
    setDrawerOpen(true);
  };

  // Change worker status
  const handleChangeWorkerStatus = (newStatus: string) => {
    if (!selectedWorker) return;
    setWorkerStatusOverrides((prev) => ({
      ...prev,
      [selectedWorker.id]: newStatus
    }));
  };

  const getStatusBadgeStyle = (statusStr: string) => {
    const s = normalizeStatus(statusStr);
    if (s === 'ON DUTY') {
      return 'bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]';
    }
    if (s === 'BUSY') {
      return 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]';
    }
    return 'bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]';
  };

  return (
    <div className="min-h-screen bg-[#EFF5FC] -mx-4 sm:-mx-6 -my-6 px-4 sm:px-8 py-7 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ================= 1. PAGE HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] font-bold text-[#1689DF] tracking-wider uppercase flex items-center gap-1.5 mb-1">
              <Layers className="w-3.5 h-3.5 text-[#1689DF]" />
              <span>MUNICIPAL WORKFORCE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#142B45]">
              Sanitation Workers
            </h1>
            <p className="text-xs sm:text-sm text-[#647A98] mt-0.5">
              View staff availability and manage collection assignments.
            </p>
          </div>

          <div className="self-start sm:self-auto shrink-0">
            <div className="px-3.5 py-1.5 rounded-full bg-white border border-[#D9E5F2] font-mono text-xs text-[#142B45] font-semibold shadow-xs flex items-center gap-2">
              <UserIcon className="w-3.5 h-3.5 text-[#1689DF]" />
              <span>TOTAL WORKERS:</span>
              <span className="font-bold text-[#142B45]">{workers.length}</span>
            </div>
          </div>
        </div>

        {/* ================= 2. SEARCH & FILTERS BAR ================= */}
        <div className="bg-white rounded-2xl border border-[#D9E5F2] p-2 sm:p-2.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 flex items-center pl-3">
            <Search className="w-4 h-4 text-[#8192A8] shrink-0" />
            <input
              type="text"
              placeholder="Search worker name, ID, or ward..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent pl-2.5 pr-4 py-1.5 text-xs text-[#142B45] placeholder-[#8192A8] outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 rounded text-[#8192A8] hover:text-[#142B45] mr-2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto p-0.5 shrink-0 scrollbar-none">
            {[
              { id: 'ALL', label: `All (${workers.length})` },
              { id: 'ON DUTY', label: `On Duty (${onDutyCount})` },
              { id: 'BUSY', label: `Busy (${busyCount})` },
              { id: 'AVAILABLE', label: `Available (${availableCount})` }
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                  statusFilter === pill.id
                    ? 'bg-[#142B45] text-white shadow-xs'
                    : 'bg-white text-[#647A98] hover:text-[#142B45] hover:bg-[#F0F5FB] border border-[#D9E5F2]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* ================= 3. WORKER CARDS GRID ================= */}
        {filteredWorkers.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-[#D9E5F2] p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF4FF] text-[#1689DF] flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#142B45]">No workers found</h3>
            <p className="text-xs text-[#647A98] mt-1 max-w-sm mx-auto">
              Try adjusting your search query or filter to see more personnel.
            </p>
            {(searchTerm !== '' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                }}
                className="mt-4 px-3.5 py-1.5 rounded-xl bg-[#142B45] text-white text-xs font-semibold hover:bg-[#1689DF] transition-colors cursor-pointer"
              >
                Show All Workers
              </button>
            )}
          </div>
        ) : (
          /* Responsive Cards Grid matching the Reference Screenshot */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredWorkers.map((w) => {
              const normStatus = normalizeStatus(w.status);
              const statusBadgeStyle = getStatusBadgeStyle(normStatus);
              const displayId = w.id.replace('_', '-');

              return (
                <div
                  key={w.id}
                  onClick={() => handleOpenWorker(w)}
                  className="bg-white rounded-2xl border border-[#D9E5F2] p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#1689DF]/50 flex flex-col items-center text-center justify-between cursor-pointer group"
                >
                  <div className="flex flex-col items-center w-full">
                    {/* Centered Circular Avatar */}
                    <div className="w-12 h-12 rounded-full bg-[#EAF4FF] text-[#1689DF] border border-[#BCE0FD] flex items-center justify-center mx-auto mb-2.5 shadow-2xs group-hover:scale-105 transition-transform">
                      <UserIcon className="w-6 h-6" />
                    </div>

                    {/* Worker ID */}
                    <span className="font-mono text-[11px] font-bold text-[#647A98] block">
                      {displayId}
                    </span>

                    {/* Worker Name */}
                    <h3 className="text-base font-bold text-[#142B45] group-hover:text-[#1689DF] transition-colors mt-0.5 leading-snug">
                      {w.name}
                    </h3>

                    {/* Ward with Pin Icon */}
                    <div className="flex items-center justify-center gap-1 text-xs text-[#647A98] mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#1689DF] shrink-0" />
                      <span>{w.ward}</span>
                    </div>

                    {/* Status Pill Badge */}
                    <span
                      className={`font-mono text-[10px] font-bold px-3.5 py-0.5 rounded-full uppercase tracking-wider my-3 ${statusBadgeStyle}`}
                    >
                      {normStatus}
                    </span>
                  </div>

                  {/* View Details Action Button spanning width */}
                  <div className="w-full pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenWorker(w);
                      }}
                      className="w-full py-1.5 px-3 rounded-xl bg-[#EAF4FF] group-hover:bg-[#1689DF] text-[#1689DF] group-hover:text-white border border-[#BCE0FD] group-hover:border-[#1689DF] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ================= 4. WORKER DETAILS DRAWER ================= */}
      <AnimatePresence>
        {drawerOpen && selectedWorker && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-[#142B45]/30 backdrop-blur-xs"
            />

            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 border-l border-[#D9E5F2]"
            >
              {/* Drawer Header */}
              <div className="px-6 py-4.5 border-b border-[#EDF2F8] flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#EAF4FF] text-[#1689DF] border border-[#BCE0FD] flex items-center justify-center font-bold text-sm">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#647A98] uppercase">
                      {selectedWorker.id.replace('_', '-')}
                    </span>
                    <h3 className="text-base font-bold text-[#142B45] leading-snug">
                      {selectedWorker.name}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-[#647A98] hover:text-[#142B45] hover:bg-[#F0F5FB] transition-colors cursor-pointer"
                  title="Close worker drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* 1. Identity & Contact Information */}
                <div className="bg-[#F8FAFC] border border-[#D9E5F2] p-4.5 rounded-2xl space-y-3">
                  <span className="text-xs font-bold text-[#142B45] block">
                    Worker Identity &amp; Contact
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                      <span className="text-[10px] font-mono text-[#647A98] uppercase block">Assigned Ward</span>
                      <span className="font-semibold text-[#142B45] mt-0.5 block">{selectedWorker.ward}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                      <span className="text-[10px] font-mono text-[#647A98] uppercase block">Contact Phone</span>
                      <span className="font-mono font-semibold text-[#142B45] mt-0.5 block">
                        {selectedWorker.phone || '+91 98220 •••••'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Availability Status Controls */}
                <div className="bg-white border border-[#D9E5F2] p-4.5 rounded-2xl space-y-2.5 shadow-2xs">
                  <span className="text-xs font-bold text-[#142B45] block">
                    Update Availability Status
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {['ON DUTY', 'BUSY', 'ON BREAK'].map((statusOption) => (
                      <button
                        key={statusOption}
                        type="button"
                        onClick={() => handleChangeWorkerStatus(statusOption)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          normalizeStatus(selectedWorker.status) === statusOption
                            ? 'bg-[#142B45] text-white border-[#142B45] shadow-xs'
                            : 'bg-white text-[#647A98] hover:text-[#142B45] border-[#D9E5F2]'
                        }`}
                      >
                        {statusOption}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Current Task Assignment */}
                <div className="bg-white border border-[#D9E5F2] p-4.5 rounded-2xl space-y-2.5 shadow-2xs">
                  <span className="text-xs font-bold text-[#142B45] block">
                    Current Task Assignment
                  </span>

                  {(() => {
                    const activeTask = getActiveTask(selectedWorker.id);
                    if (activeTask) {
                      return (
                        <div className="p-3 rounded-xl bg-[#EAF4FF] border border-[#BCE0FD] text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[#1689DF]">{activeTask.id}</span>
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                              {activeTask.status}
                            </span>
                          </div>
                          <p className="font-semibold text-[#142B45]">{activeTask.title || 'Dustbin Clearance'}</p>
                          <div className="text-[11px] text-[#647A98] flex items-center justify-between pt-1">
                            <span>Target: {activeTask.bin_id || activeTask.dustbinId || activeTask.ward}</span>
                            <Link
                              to={`/worker/tasks/${activeTask.id}`}
                              className="text-[#1689DF] hover:underline flex items-center gap-0.5 font-semibold"
                            >
                              <span>View Task</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-emerald-800 font-medium">
                        No active assignment. Worker is free to accept dispatch tasks.
                      </div>
                    );
                  })()}
                </div>

                {/* 4. Daily Collection Performance */}
                <div className="bg-white border border-[#D9E5F2] p-4.5 rounded-2xl space-y-2.5 shadow-2xs">
                  <span className="text-xs font-bold text-[#142B45] block">
                    Collection Performance
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[10px] font-mono text-[#647A98] uppercase block">Cleared Today</span>
                      <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
                        {selectedWorker.tasks_completed_today ?? selectedWorker.tasksCompletedToday ?? 0} Bins
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[10px] font-mono text-[#647A98] uppercase block">Performance Rating</span>
                      <span className="text-lg font-bold text-[#142B45] mt-0.5 flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>{selectedWorker.rating ? `${selectedWorker.rating} / 5.0` : '4.8 / 5.0'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Recent Task History */}
                <div className="bg-white border border-[#D9E5F2] p-4.5 rounded-2xl space-y-2.5 shadow-2xs">
                  <span className="text-xs font-bold text-[#142B45] block">
                    Recent Collection History ({workerTaskHistory.length})
                  </span>

                  {workerTaskHistory.length === 0 ? (
                    <p className="text-xs text-[#8192A8] italic">No tasks logged for this worker today.</p>
                  ) : (
                    <div className="space-y-2">
                      {workerTaskHistory.slice(0, 4).map((t) => (
                        <div
                          key={t.id}
                          className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#EDF2F8] text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono font-bold text-[#142B45]">{t.id}</span>
                            <span className="text-[11px] text-[#647A98] block">
                              {t.location || t.area || t.ward}
                            </span>
                          </div>
                          <span
                            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                              t.status === 'VERIFIED' || t.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[#EDF2F8] bg-[#F8FAFC] flex items-center justify-between shrink-0">
                <span className="text-[11px] font-mono text-[#647A98]">
                  Worker Roster ID: {selectedWorker.id.replace('_', '-')}
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-white border border-[#D9E5F2] hover:bg-[#F0F5FB] text-xs font-semibold text-[#142B45] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
