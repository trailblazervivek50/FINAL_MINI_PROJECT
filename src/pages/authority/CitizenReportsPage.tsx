import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useMunicipal } from '../../context/MunicipalContext';
import { useWasteSystem } from '../../context/WasteSystemContext';
import {
  AlertCircle,
  Search,
  Filter,
  Copy,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  Calendar,
  X,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Maximize2,
  CameraOff,
  User,
  Check,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Inbox,
  Send,
  Navigation
} from 'lucide-react';
import { CitizenReport } from '../../types';

// Strictly the two user-provided reference incident photographs
const REFERENCE_PHOTO_1 = '/images/reference/reference_incident_1.jpg';
const REFERENCE_PHOTO_2 = '/images/reference/reference_incident_2.jpg';

export const CitizenReportsPage: React.FC = () => {
  const {
    reports: municipalReports,
    workers,
    updateReportStatus,
    refreshData,
    isLoading
  } = useMunicipal();

  const { reports: fallbackReports } = useWasteSystem();

  // Prefer backend reports from MunicipalContext; fallback to WasteSystemContext if empty (excluding removed REP_003 and REP_004)
  const rawReports = useMemo(() => {
    const list =
      municipalReports && municipalReports.length > 0 ? municipalReports : fallbackReports || [];
    return list.filter((r) => r.id !== 'REP_003' && r.id !== 'REP_004');
  }, [municipalReports, fallbackReports]);

  // Local state for instant optimistic updates
  const [localReportsOverride, setLocalReportsOverride] = useState<Record<string, Partial<CitizenReport>>>({});

  // Merge raw reports with any local updates
  const reports: CitizenReport[] = useMemo(() => {
    return rawReports.map((r) => {
      const override = localReportsOverride[r.id];
      if (override) {
        return { ...r, ...override };
      }
      return r;
    });
  }, [rawReports, localReportsOverride]);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [wardFilter, setWardFilter] = useState<string>('ALL');
  const [issueFilter, setIssueFilter] = useState<string>('ALL');
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  // Drawer & Lightbox states
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption: string; reportId: string } | null>(null);

  // Drawer action states
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Helper to determine image for a report strictly respecting the two reference photographs rule
  const getReportPhoto = (report: CitizenReport, index: number): string | null => {
    const rawPhoto = report.photo_url || report.photoUrl;
    // If genuine custom upload (e.g. data URL or local /uploads/ file), preserve genuine upload
    if (rawPhoto && (rawPhoto.startsWith('data:image/') || rawPhoto.startsWith('/uploads/'))) {
      return rawPhoto;
    }
    // Strictly map sample incident reports to ONLY the two user reference photographs
    if (index === 0) return REFERENCE_PHOTO_1;
    if (index === 1) return REFERENCE_PHOTO_2;
    // Do NOT add a third sample photo or stock images
    return null;
  };

  // Selected report object
  const selectedReport = useMemo(() => {
    if (!selectedReportId) return null;
    return reports.find((r) => r.id === selectedReportId) || null;
  }, [selectedReportId, reports]);

  const selectedReportIndex = useMemo(() => {
    if (!selectedReportId) return -1;
    return reports.findIndex((r) => r.id === selectedReportId);
  }, [selectedReportId, reports]);

  // Sync selected worker when report changes
  useEffect(() => {
    if (selectedReport) {
      setSelectedWorkerId(selectedReport.assigned_worker_id || '');
      setResolutionNotes(selectedReport.resolution_notes || '');
      setConfirmAction(null);
      setActionSuccess(null);
      setActionError(null);
    }
  }, [selectedReport]);

  // Handle ESC key to close drawer or lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxImage) {
          setLightboxImage(null);
        } else if (drawerOpen) {
          setDrawerOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, drawerOpen]);

  // Extract distinct wards for filter dropdown
  const availableWards = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.ward) set.add(r.ward);
    });
    return Array.from(set).sort();
  }, [reports]);

  // Extract distinct issues for filter dropdown
  const availableIssues = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.issue) set.add(r.issue);
    });
    return Array.from(set).sort();
  }, [reports]);

  // Status normalizer helper
  const normalizeStatus = (status: any): string => {
    const s = String(status || '').toUpperCase();
    if (s === 'SUBMITTED' || s === 'UNDER_REVIEW' || s === 'UNDER REVIEW') return 'UNDER REVIEW';
    if (s === 'IN_PROGRESS' || s === 'IN PROGRESS') return 'IN PROGRESS';
    if (s === 'ASSIGNED') return 'ASSIGNED';
    if (s === 'RESOLVED') return 'RESOLVED';
    if (s === 'DUPLICATE') return 'DUPLICATE';
    if (s === 'REJECTED') return 'REJECTED';
    return s || 'UNDER REVIEW';
  };

  // Priority normalizer helper
  const normalizePriority = (priority: any): string => {
    const p = String(priority || '').toUpperCase();
    if (p === 'CRITICAL') return 'CRITICAL';
    if (p === 'HIGH') return 'HIGH';
    if (p === 'MEDIUM' || p === 'NORMAL') return 'NORMAL';
    if (p === 'LOW') return 'LOW';
    return 'NORMAL';
  };

  // 4 Summary Metrics (Calculated from real reports)
  const totalCount = reports.length;
  const pendingCount = reports.filter((r) => {
    const s = normalizeStatus(r.status);
    return s === 'UNDER REVIEW';
  }).length;
  const inProgressCount = reports.filter((r) => {
    const s = normalizeStatus(r.status);
    return s === 'ASSIGNED' || s === 'IN PROGRESS';
  }).length;
  const resolvedCount = reports.filter((r) => {
    const s = normalizeStatus(r.status);
    return s === 'RESOLVED';
  }).length;

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // 1. Search Query
      const q = searchTerm.toLowerCase().trim();
      if (q) {
        const idMatch = (r.id || '').toLowerCase().includes(q);
        const wardMatch = (r.ward || '').toLowerCase().includes(q);
        const areaMatch = (r.area || '').toLowerCase().includes(q);
        const issueMatch = (r.issue || '').toLowerCase().includes(q);
        const descMatch = (r.description || '').toLowerCase().includes(q);
        const citizenMatch = (r.citizen_name || '').toLowerCase().includes(q);
        const binMatch = (r.bin_id || r.dustbinId || '').toLowerCase().includes(q);
        if (!idMatch && !wardMatch && !areaMatch && !issueMatch && !descMatch && !citizenMatch && !binMatch) {
          return false;
        }
      }

      // 2. Status Filter
      const normStatus = normalizeStatus(r.status);
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'UNDER REVIEW') {
          if (normStatus !== 'UNDER REVIEW') return false;
        } else if (statusFilter === 'ASSIGNED') {
          if (normStatus !== 'ASSIGNED') return false;
        } else if (statusFilter === 'IN PROGRESS') {
          if (normStatus !== 'IN PROGRESS') return false;
        } else if (statusFilter === 'RESOLVED') {
          if (normStatus !== 'RESOLVED') return false;
        } else if (statusFilter === 'DUPLICATE') {
          if (!r.isDuplicate && normStatus !== 'DUPLICATE') return false;
        } else {
          if (normStatus !== statusFilter) return false;
        }
      }

      // 3. Priority Filter
      if (priorityFilter !== 'ALL') {
        const normPriority = normalizePriority(r.priority);
        if (normPriority !== priorityFilter) return false;
      }

      // 4. Ward Filter
      if (wardFilter !== 'ALL' && r.ward !== wardFilter) {
        return false;
      }

      // 5. Issue Filter
      if (issueFilter !== 'ALL' && r.issue !== issueFilter) {
        return false;
      }

      return true;
    });
  }, [reports, searchTerm, statusFilter, priorityFilter, wardFilter, issueFilter]);

  // Click on Summary Card toggles filter
  const handleSummaryCardClick = (target: string) => {
    if (statusFilter === target) {
      setStatusFilter('ALL');
    } else {
      setStatusFilter(target);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setWardFilter('ALL');
    setIssueFilter('ALL');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'ALL' ||
    priorityFilter !== 'ALL' ||
    wardFilter !== 'ALL' ||
    issueFilter !== 'ALL';

  // Open Details Drawer
  const handleOpenDetails = (report: CitizenReport) => {
    setSelectedReportId(report.id);
    setDrawerOpen(true);
  };

  // Assign Worker action
  const handleAssignWorker = async () => {
    if (!selectedReport || !selectedWorkerId) return;
    const worker = workers.find((w) => w.id === selectedWorkerId);
    const workerName = worker ? worker.name : selectedWorkerId;

    setActionLoading(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      setLocalReportsOverride((prev) => ({
        ...prev,
        [selectedReport.id]: {
          status: 'ASSIGNED',
          assigned_worker_id: selectedWorkerId,
          assigned_worker_name: workerName
        }
      }));

      await updateReportStatus(selectedReport.id, {
        status: 'ASSIGNED',
        assigned_worker_id: selectedWorkerId
      });

      setActionSuccess(`Assigned to ${workerName}. Task created in workforce queue.`);
      await refreshData();
    } catch (err: any) {
      console.error('Failed to assign worker:', err);
      setActionError('Could not assign worker. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Status action (Resolve, In Progress, Under Review, Reject)
  const handleExecuteStatusUpdate = async (newStatus: string) => {
    if (!selectedReport) return;

    setActionLoading(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const updates: any = {
        status: newStatus
      };
      if (resolutionNotes.trim()) {
        updates.resolution_notes = resolutionNotes.trim();
      }

      setLocalReportsOverride((prev) => ({
        ...prev,
        [selectedReport.id]: {
          status: newStatus,
          resolution_notes: updates.resolution_notes
        }
      }));

      await updateReportStatus(selectedReport.id, updates);
      setActionSuccess(`Report status updated to ${newStatus}.`);
      setConfirmAction(null);
      await refreshData();
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setActionError('Status update failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Change Priority action
  const handleChangePriority = async (newPriority: string) => {
    if (!selectedReport) return;

    setActionLoading(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      setLocalReportsOverride((prev) => ({
        ...prev,
        [selectedReport.id]: {
          priority: newPriority
        }
      }));

      await updateReportStatus(selectedReport.id, { priority: newPriority });
      setActionSuccess(`Priority updated to ${newPriority}.`);
      await refreshData();
    } catch (err: any) {
      console.error('Failed to update priority:', err);
      setActionError('Could not change priority.');
    } finally {
      setActionLoading(false);
    }
  };

  // Semantic styles
  const getPriorityBadgeStyle = (priority: any) => {
    const p = normalizePriority(priority);
    if (p === 'CRITICAL') {
      return {
        badge: 'bg-rose-50 text-rose-700 border border-rose-200/80',
        dot: 'bg-rose-500'
      };
    }
    if (p === 'HIGH') {
      return {
        badge: 'bg-amber-50 text-amber-700 border border-amber-200/80',
        dot: 'bg-amber-500'
      };
    }
    if (p === 'LOW') {
      return {
        badge: 'bg-slate-50 text-slate-600 border border-slate-200/80',
        dot: 'bg-slate-400'
      };
    }
    return {
      badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
      dot: 'bg-emerald-500'
    };
  };

  const getStatusBadgeStyle = (status: any) => {
    const s = normalizeStatus(status);
    if (s === 'UNDER REVIEW') {
      return 'bg-blue-50 text-blue-700 border border-blue-200/80';
    }
    if (s === 'ASSIGNED') {
      return 'bg-indigo-50 text-indigo-700 border border-indigo-200/80';
    }
    if (s === 'IN PROGRESS') {
      return 'bg-amber-50 text-amber-700 border border-amber-200/80';
    }
    if (s === 'RESOLVED') {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
    }
    if (s === 'DUPLICATE') {
      return 'bg-amber-100 text-amber-800 border border-amber-300';
    }
    if (s === 'REJECTED') {
      return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
    return 'bg-blue-50 text-blue-700 border border-blue-200/80';
  };

  return (
    <div className="min-h-screen bg-[#EFF4FB] -mx-4 sm:-mx-6 -my-6 px-4 sm:px-8 py-7 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ================= 1. PAGE HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#142B45]">
              Citizen Waste Reports
            </h1>
            <p className="text-xs sm:text-sm text-[#647A98] mt-1">
              Review public waste complaints and track municipal resolution.
            </p>
          </div>

          <div className="self-start sm:self-auto shrink-0">
            <div className="px-3.5 py-1.5 rounded-xl bg-white border border-[#D9E5F2] font-mono text-xs text-[#647A98] shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1689DF] animate-pulse" />
              <span>TOTAL REPORTS:</span>
              <span className="font-bold text-[#142B45]">{totalCount} LOGGED</span>
            </div>
          </div>
        </div>

        {/* ================= 2. FOUR SUMMARY CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Reports */}
          <div
            onClick={() => handleSummaryCardClick('ALL')}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all duration-200 relative overflow-hidden cursor-pointer select-none ${
              statusFilter === 'ALL'
                ? 'border-[#1689DF] ring-2 ring-[#1689DF]/20 shadow-md'
                : 'border-[#D9E5F2] hover:border-[#1689DF]/50 hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-11 h-11 rounded-xl bg-[#EAF4FF] border border-[#BCE0FD] text-[#1689DF] flex items-center justify-center shrink-0 shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#647A98] uppercase tracking-wider">
                  TOTAL REPORTS
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-[#142B45] mt-0.5 leading-none">
                  {totalCount}
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
                fill="#EAF4FF"
                fillOpacity="0.85"
              />
              <path
                d="M30,80 C70,60 110,80 150,65 L160,80 L30,80 Z"
                fill="#DBEAFE"
                fillOpacity="0.55"
              />
            </svg>
          </div>

          {/* Card 2: Pending Review */}
          <div
            onClick={() => handleSummaryCardClick('UNDER REVIEW')}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all duration-200 relative overflow-hidden cursor-pointer select-none ${
              statusFilter === 'UNDER REVIEW'
                ? 'border-[#F59E0B] ring-2 ring-[#F59E0B]/20 shadow-md'
                : 'border-[#D9E5F2] hover:border-[#F59E0B]/50 hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#647A98] uppercase tracking-wider">
                  PENDING REVIEW
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-[#142B45] mt-0.5 leading-none">
                  {pendingCount}
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
                fill="#FEF3C7"
                fillOpacity="0.85"
              />
              <path
                d="M30,80 C70,60 110,80 150,65 L160,80 L30,80 Z"
                fill="#FDE68A"
                fillOpacity="0.5"
              />
            </svg>
          </div>

          {/* Card 3: Assigned / In Progress */}
          <div
            onClick={() => handleSummaryCardClick('IN PROGRESS')}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all duration-200 relative overflow-hidden cursor-pointer select-none ${
              statusFilter === 'IN PROGRESS' || statusFilter === 'ASSIGNED'
                ? 'border-[#EA580C] ring-2 ring-[#EA580C]/20 shadow-md'
                : 'border-[#D9E5F2] hover:border-[#EA580C]/50 hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-11 h-11 rounded-xl bg-[#FFEDD5] border border-[#FED7AA] text-[#EA580C] flex items-center justify-center shrink-0 shadow-2xs">
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#647A98] uppercase tracking-wider">
                  ASSIGNED / IN PROGRESS
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
                fill="#FFEDD5"
                fillOpacity="0.85"
              />
              <path
                d="M30,80 C70,60 110,80 150,65 L160,80 L30,80 Z"
                fill="#FED7AA"
                fillOpacity="0.5"
              />
            </svg>
          </div>

          {/* Card 4: Resolved */}
          <div
            onClick={() => handleSummaryCardClick('RESOLVED')}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all duration-200 relative overflow-hidden cursor-pointer select-none ${
              statusFilter === 'RESOLVED'
                ? 'border-[#10B981] ring-2 ring-[#10B981]/20 shadow-md'
                : 'border-[#D9E5F2] hover:border-[#10B981]/50 hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-11 h-11 rounded-xl bg-[#D1FAE5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center shrink-0 shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#647A98] uppercase tracking-wider">
                  RESOLVED
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-[#142B45] mt-0.5 leading-none">
                  {resolvedCount}
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
                fill="#D1FAE5"
                fillOpacity="0.85"
              />
              <path
                d="M30,80 C70,60 110,80 150,65 L160,80 L30,80 Z"
                fill="#A7F3D0"
                fillOpacity="0.5"
              />
            </svg>
          </div>
        </div>

        {/* ================= 3. SEARCH AND FILTERS BAR ================= */}
        <div className="bg-white rounded-2xl border border-[#D9E5F2] p-2.5 sm:p-3 shadow-xs space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 flex items-center pl-3">
              <Search className="w-4 h-4 text-[#8192A8] shrink-0" />
              <input
                type="text"
                placeholder="Search by report ID, location, ward, or incident type..."
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

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto p-0.5 shrink-0 scrollbar-none">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'UNDER REVIEW', label: 'Under Review' },
                { id: 'ASSIGNED', label: 'Assigned' },
                { id: 'IN PROGRESS', label: 'In Progress' },
                { id: 'RESOLVED', label: 'Resolved' },
                { id: 'DUPLICATE', label: 'Duplicate' }
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setStatusFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                    statusFilter === pill.id
                      ? 'bg-[#142B45] text-white shadow-xs'
                      : 'bg-white text-[#647A98] hover:text-[#142B45] hover:bg-[#F0F5FB] border border-[#D9E5F2]'
                  }`}
                >
                  {pill.label}
                </button>
              ))}

              {/* Advanced Filters Toggle Button */}
              <button
                type="button"
                onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  advancedFiltersOpen || priorityFilter !== 'ALL' || wardFilter !== 'ALL' || issueFilter !== 'ALL'
                    ? 'bg-[#EAF4FF] text-[#1689DF] border-[#BCE0FD]'
                    : 'bg-white text-[#647A98] hover:text-[#142B45] border-[#D9E5F2]'
                }`}
                title="Toggle advanced filters"
              >
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Filters</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${advancedFiltersOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Collapsible Advanced Filters */}
          <AnimatePresence>
            {advancedFiltersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden pt-2.5 border-t border-[#EDF2F8]"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 pb-1">
                  <div>
                    <label className="block text-[10px] font-bold text-[#647A98] uppercase tracking-wider mb-1">
                      Urgency Priority
                    </label>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#D9E5F2] rounded-xl px-2.5 py-1.5 text-xs text-[#142B45] outline-none focus:border-[#1689DF]"
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="CRITICAL">Critical Priority</option>
                      <option value="HIGH">High Priority</option>
                      <option value="NORMAL">Normal / Medium Priority</option>
                      <option value="LOW">Low Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#647A98] uppercase tracking-wider mb-1">
                      Municipal Ward
                    </label>
                    <select
                      value={wardFilter}
                      onChange={(e) => setWardFilter(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#D9E5F2] rounded-xl px-2.5 py-1.5 text-xs text-[#142B45] outline-none focus:border-[#1689DF]"
                    >
                      <option value="ALL">All Wards</option>
                      {availableWards.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#647A98] uppercase tracking-wider mb-1">
                      Incident Category
                    </label>
                    <select
                      value={issueFilter}
                      onChange={(e) => setIssueFilter(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#D9E5F2] rounded-xl px-2.5 py-1.5 text-xs text-[#142B45] outline-none focus:border-[#1689DF]"
                    >
                      <option value="ALL">All Incident Types</option>
                      {availableIssues.map((issue) => (
                        <option key={issue} value={issue}>
                          {issue}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex items-center justify-between pt-2 text-xs">
                    <span className="text-[#647A98]">
                      Showing {filteredReports.length} of {totalCount} complaints
                    </span>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-[#1689DF] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset all filters</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ================= 4. CITIZEN REPORT CARDS LIST ================= */}
        {isLoading && reports.length === 0 ? (
          <div className="space-y-3.5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-[#D9E5F2] p-4 sm:p-5 shadow-xs animate-pulse flex flex-col md:flex-row gap-4 items-start md:items-center"
              >
                <div className="w-24 h-24 rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2.5 w-full">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-5 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-[#D9E5F2] p-12 text-center shadow-xs">
            <div className="w-13 h-13 rounded-2xl bg-[#EAF4FF] border border-[#BCE0FD] text-[#1689DF] flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
              <Inbox className="w-6 h-6" />
            </div>
            {hasActiveFilters ? (
              <>
                <h3 className="text-base font-bold text-[#142B45]">No reports found</h3>
                <p className="text-xs text-[#647A98] mt-1 max-w-sm mx-auto">
                  No public complaints matched your search keywords or active filters.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#142B45] text-white text-xs font-semibold hover:bg-[#1689DF] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-[#142B45]">No citizen reports yet</h3>
                <p className="text-xs text-[#647A98] mt-1 max-w-sm mx-auto">
                  New reports submitted by citizens will appear here.
                </p>
              </>
            )}
          </div>
        ) : (
          /* Report Cards */
          <div className="space-y-3.5">
            {filteredReports.map((report, idx) => {
              const priorityStyle = getPriorityBadgeStyle(report.priority);
              const statusBadgeStyle = getStatusBadgeStyle(report.status);
              const photoUrl = getReportPhoto(report, idx);
              const normalizedStatus = normalizeStatus(report.status);

              return (
                <div
                  key={report.id}
                  onClick={() => handleOpenDetails(report)}
                  className="bg-white rounded-2xl border border-[#D9E5F2] p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#1689DF]/50 cursor-pointer group"
                >
                  <div className="flex flex-col md:flex-row gap-4 sm:gap-5 items-start md:items-center justify-between">

                    {/* Left & Middle Column */}
                    <div className="flex flex-col sm:flex-row items-start gap-4 flex-1 min-w-0">
                      {/* Left: Consistent Image Thumbnail */}
                      <div className="relative shrink-0 group/img">
                        {photoUrl ? (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxImage({
                                url: photoUrl,
                                caption: `${report.issue} - ${report.area} (${report.ward})`,
                                reportId: report.id
                              });
                            }}
                            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-[#D9E5F2] bg-[#F8FAFC] cursor-zoom-in"
                            title="Click to view full photograph"
                          >
                            <img
                              src={photoUrl}
                              alt={report.issue || 'Incident'}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="p-1.5 rounded-lg bg-white/90 text-[#142B45] shadow-xs">
                                <Maximize2 className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-[#F0F5FB] border border-[#D9E5F2] flex flex-col items-center justify-center text-[#8192A8] p-2 text-center">
                            <CameraOff className="w-6 h-6 mb-1 text-[#8192A8]" />
                            <span className="text-[10px] font-medium leading-tight">No Photo Attached</span>
                          </div>
                        )}
                      </div>

                      {/* Middle: Report Details */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Top Metadata Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm sm:text-base font-bold text-[#142B45]">
                            {report.id}
                          </span>

                          <span
                            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${priorityStyle.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`} />
                            <span>{normalizePriority(report.priority)}</span>
                          </span>

                          {report.isDuplicate && (
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Copy className="w-2.5 h-2.5" />
                              <span>DUPLICATE CLUSTER</span>
                            </span>
                          )}
                        </div>

                        {/* Short Incident Title */}
                        <h3 className="text-sm sm:text-base font-semibold text-[#142B45] group-hover:text-[#1689DF] transition-colors leading-snug">
                          {report.issue}
                        </h3>

                        {/* Location and Ward */}
                        <div className="flex items-center gap-1.5 text-xs text-[#526985]">
                          <MapPin className="w-3.5 h-3.5 text-[#1689DF] shrink-0" />
                          <span>
                            {report.area} &bull; <strong className="text-[#142B45] font-semibold">{report.ward}</strong>
                          </span>
                        </div>

                        {/* Short Description */}
                        <p className="text-xs text-[#647A98] line-clamp-2 leading-relaxed">
                          {report.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Current Status & View Details Action */}
                    <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[#EDF2F8] gap-3 shrink-0">
                      <span
                        className={`font-mono text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${statusBadgeStyle}`}
                      >
                        {normalizedStatus}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetails(report);
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#1689DF] bg-[#F0F5FB] group-hover:bg-[#1689DF] group-hover:text-white border border-[#D9E5F2] group-hover:border-[#1689DF] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ================= 5. RIGHT-SIDE INSPECTION DRAWER ================= */}
      <AnimatePresence>
        {drawerOpen && selectedReport && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-[#142B45]/30 backdrop-blur-xs"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-xl md:max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 border-l border-[#D9E5F2]"
            >
              {/* Drawer Header */}
              <div className="px-6 py-4.5 border-b border-[#EDF2F8] flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] text-[#1689DF] flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono font-bold text-[#647A98] uppercase tracking-wider">
                      INCIDENT AUDIT
                    </div>
                    <div className="text-base font-bold text-[#142B45] flex items-center gap-2">
                      <span>{selectedReport.id}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${getStatusBadgeStyle(
                          selectedReport.status
                        )}`}
                      >
                        {normalizeStatus(selectedReport.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-[#647A98] hover:text-[#142B45] hover:bg-[#F0F5FB] transition-colors cursor-pointer"
                  title="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Feedback Toast */}
                <AnimatePresence>
                  {actionSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{actionSuccess}</span>
                    </motion.div>
                  )}
                  {actionError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{actionError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Full Photograph */}
                {(() => {
                  const photo = getReportPhoto(selectedReport, selectedReportIndex);
                  return (
                    <div>
                      <div className="text-xs font-bold text-[#647A98] uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Incident Photograph</span>
                        {photo && (
                          <span className="text-[11px] text-[#1689DF] font-medium lowercase font-mono">
                            tap photo to enlarge
                          </span>
                        )}
                      </div>

                      {photo ? (
                        <div
                          onClick={() =>
                            setLightboxImage({
                              url: photo,
                              caption: `${selectedReport.issue} - ${selectedReport.area}`,
                              reportId: selectedReport.id
                            })
                          }
                          className="relative rounded-2xl overflow-hidden border border-[#D9E5F2] bg-[#F8FAFC] group cursor-zoom-in max-h-72"
                        >
                          <img
                            src={photo}
                            alt="Incident"
                            className="w-full h-64 object-cover group-hover:scale-102 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-3 py-1.5 rounded-xl bg-white/95 text-[#142B45] text-xs font-semibold shadow-md flex items-center gap-1.5">
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>View Full Resolution</span>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-40 rounded-2xl bg-[#F0F5FB] border border-[#D9E5F2] flex flex-col items-center justify-center text-[#8192A8] p-4 text-center">
                          <CameraOff className="w-8 h-8 mb-2" />
                          <span className="text-xs font-medium">No incident photo submitted</span>
                          <span className="text-[11px] opacity-75 mt-0.5">Citizen did not upload an attachment</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Complaint Classification & Full Description */}
                <div className="bg-[#F8FAFC] border border-[#D9E5F2] p-4.5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#647A98] uppercase">ISSUE CLASSIFICATION</span>
                      <h4 className="text-base font-bold text-[#142B45]">{selectedReport.issue}</h4>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-mono font-bold text-[#647A98] uppercase">PRIORITY LEVEL</span>
                      <span
                        className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md mt-0.5 ${
                          getPriorityBadgeStyle(selectedReport.priority).badge
                        }`}
                      >
                        {normalizePriority(selectedReport.priority)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#647A98] uppercase">FULL CITIZEN DESCRIPTION</span>
                    <p className="text-xs text-[#142B45] leading-relaxed mt-1 whitespace-pre-wrap bg-white p-3 rounded-xl border border-[#E2E8F0]">
                      {selectedReport.description}
                    </p>
                  </div>
                </div>

                {/* Location & Node Context */}
                <div className="bg-white border border-[#D9E5F2] p-4.5 rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#142B45] flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#1689DF]" />
                      <span>Geospatial Location</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-[#142B45] bg-[#F0F5FB] px-2.5 py-1 rounded-lg border border-[#D9E5F2]">
                      {selectedReport.ward}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EDF2F8]">
                      <span className="text-[10px] font-mono text-[#647A98] uppercase block">Area / Locality</span>
                      <span className="font-semibold text-[#142B45] mt-0.5 block">{selectedReport.area}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EDF2F8]">
                      <span className="text-[10px] font-mono text-[#647A98] uppercase block">Linked Dustbin Node</span>
                      {selectedReport.bin_id || selectedReport.dustbinId ? (
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="font-mono font-bold text-[#1689DF]">
                            {selectedReport.bin_id || selectedReport.dustbinId}
                          </span>
                          <Link
                            to={`/authority/dustbins/${selectedReport.bin_id || selectedReport.dustbinId}`}
                            className="text-[11px] text-[#1689DF] hover:underline flex items-center gap-0.5 font-medium"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      ) : (
                        <span className="text-[#8192A8] italic mt-0.5 block">Not linked to fixed bin</span>
                      )}
                    </div>
                  </div>

                  {(selectedReport.latitude || (selectedReport.coordinates && selectedReport.coordinates[0])) && (
                    <div className="p-3 rounded-xl bg-[#EAF4FF] border border-[#BCE0FD] flex items-center justify-between text-xs text-[#142B45]">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-[#1689DF]" />
                        <span className="font-mono text-[11px]">
                          GPS:{' '}
                          {(selectedReport.latitude || selectedReport.coordinates?.[0])?.toFixed(4)}° N,{' '}
                          {(selectedReport.longitude || selectedReport.coordinates?.[1])?.toFixed(4)}° E
                        </span>
                      </div>
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${selectedReport.latitude || selectedReport.coordinates?.[0]}&mlon=${selectedReport.longitude || selectedReport.coordinates?.[1]}#map=16`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#1689DF] hover:underline font-semibold flex items-center gap-0.5"
                      >
                        <span>OpenMap</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Reporter Metadata */}
                <div className="bg-white border border-[#D9E5F2] p-4.5 rounded-2xl space-y-2.5 shadow-2xs">
                  <span className="text-xs font-bold text-[#142B45] flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#1689DF]" />
                    <span>Reporter Information</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#F8FAFC]">
                      <span className="text-[10px] font-mono text-[#647A98] uppercase block">Citizen Name</span>
                      <span className="font-semibold text-[#142B45] mt-0.5 block">
                        {selectedReport.citizen_name || 'Concerned Citizen'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#F8FAFC]">
                      <span className="text-[10px] font-mono text-[#647A98] uppercase block">Phone / Contact</span>
                      <span className="font-mono text-[#142B45] mt-0.5 block">
                        {selectedReport.citizen_phone || 'Protected / Not Provided'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Duplicate Notice */}
                {selectedReport.isDuplicate && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Copy className="w-4 h-4 text-amber-700" />
                      <span>Automated Duplicate Cluster Detected</span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      {selectedReport.duplicateNotice ||
                        'A similar citizen complaint was submitted within 120 metres during the current collection cycle.'}
                    </p>
                  </div>
                )}

                {/* Worker Assignment */}
                <div className="bg-white border border-[#D9E5F2] p-4.5 rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#142B45] flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[#1689DF]" />
                      <span>Workforce Task Assignment</span>
                    </span>
                    {selectedReport.assigned_worker_name && (
                      <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                        ACTIVE DISPATCH
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] text-[#647A98] font-medium block">
                      Select Sanitation Worker to Dispatch:
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedWorkerId}
                        onChange={(e) => setSelectedWorkerId(e.target.value)}
                        className="flex-1 bg-[#F8FAFC] border border-[#D9E5F2] rounded-xl px-3 py-2 text-xs text-[#142B45] outline-none focus:border-[#1689DF]"
                      >
                        <option value="">-- Choose Field Worker --</option>
                        {workers.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({w.ward}) - {w.status}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        disabled={!selectedWorkerId || actionLoading}
                        onClick={handleAssignWorker}
                        className="px-4 py-2 rounded-xl bg-[#1689DF] hover:bg-[#1479c4] disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch</span>
                      </button>
                    </div>

                    {selectedReport.assigned_worker_name && (
                      <div className="p-2.5 rounded-xl bg-[#EAF4FF] border border-[#BCE0FD] text-[11px] text-[#142B45] flex items-center justify-between mt-2">
                        <span>
                          Assigned to: <strong>{selectedReport.assigned_worker_name}</strong>
                        </span>
                        <span className="font-mono opacity-75">{selectedReport.assigned_worker_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority Tuning */}
                <div className="bg-white border border-[#D9E5F2] p-4.5 rounded-2xl space-y-2.5 shadow-2xs">
                  <span className="text-xs font-bold text-[#142B45] block">
                    Adjust Operational Priority
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: 'CRITICAL', label: 'Critical', color: 'border-rose-300 text-rose-700 hover:bg-rose-50' },
                      { id: 'HIGH', label: 'High', color: 'border-amber-300 text-amber-700 hover:bg-amber-50' },
                      { id: 'NORMAL', label: 'Normal / Medium', color: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleChangePriority(p.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          normalizePriority(selectedReport.priority) === p.id
                            ? 'bg-[#142B45] text-white border-[#142B45] shadow-xs'
                            : `bg-white ${p.color}`
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Transitions */}
                <div className="bg-white border border-[#D9E5F2] p-4.5 rounded-2xl space-y-3 shadow-2xs">
                  <span className="text-xs font-bold text-[#142B45] block">
                    Municipal Status Actions
                  </span>

                  <div>
                    <label className="text-[11px] text-[#647A98] font-medium block mb-1">
                      Resolution Notes / Verification Remarks:
                    </label>
                    <textarea
                      rows={2}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Add clearance verification notes or remarks..."
                      className="w-full bg-[#F8FAFC] border border-[#D9E5F2] rounded-xl p-2.5 text-xs text-[#142B45] outline-none focus:border-[#1689DF] resize-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {normalizeStatus(selectedReport.status) !== 'IN PROGRESS' &&
                      normalizeStatus(selectedReport.status) !== 'RESOLVED' && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleExecuteStatusUpdate('IN_PROGRESS')}
                          className="px-3.5 py-2 rounded-xl bg-[#FEF3C7] text-amber-800 border border-amber-300 hover:bg-amber-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Mark In Progress</span>
                        </button>
                      )}

                    {normalizeStatus(selectedReport.status) !== 'RESOLVED' && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => {
                          if (!confirmAction) {
                            setConfirmAction('RESOLVE');
                          } else if (confirmAction === 'RESOLVE') {
                            handleExecuteStatusUpdate('RESOLVED');
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{confirmAction === 'RESOLVE' ? 'Confirm Resolve Report' : 'Mark as Resolved'}</span>
                      </button>
                    )}

                    {confirmAction && (
                      <button
                        type="button"
                        onClick={() => setConfirmAction(null)}
                        className="px-2.5 py-2 text-xs text-[#647A98] hover:text-[#142B45] underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[#EDF2F8] bg-[#F8FAFC] flex items-center justify-between shrink-0">
                <span className="text-[11px] font-mono text-[#647A98]">
                  Created: {selectedReport.created_at || selectedReport.timestamp || 'Today'}
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-white border border-[#D9E5F2] hover:bg-[#F0F5FB] text-xs font-semibold text-[#142B45] transition-colors cursor-pointer"
                >
                  Close Inspection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= 6. LIGHTBOX IMAGE PREVIEW MODAL ================= */}
      <AnimatePresence>
        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-[#142B45] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="p-3.5 bg-black/40 text-white flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-[#1689DF]">{lightboxImage.reportId}</span>
                  <span>&bull;</span>
                  <span className="truncate">{lightboxImage.caption}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-2 sm:p-4 flex items-center justify-center bg-black/60 max-h-[78vh] overflow-hidden">
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.caption}
                  className="max-h-[74vh] max-w-full object-contain rounded-xl shadow-lg"
                />
              </div>

              <div className="p-3 bg-black/40 text-white/70 text-[11px] font-mono flex items-center justify-between border-t border-white/10">
                <span>Citizen Evidence Photo</span>
                <span className="text-white/50">Press ESC or click anywhere outside to close</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
