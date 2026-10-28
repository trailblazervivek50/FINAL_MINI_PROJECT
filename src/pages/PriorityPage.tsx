import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMunicipal } from '../context/MunicipalContext';
import {
  ListOrdered,
  Truck,
  MapPin,
  Cpu,
  Check,
  RotateCcw,
  AlertCircle,
  ChevronDown,
  Navigation,
  ExternalLink,
  Radio,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { Bin } from '../types';
import { TelemetryHighlight } from '../components/common/TelemetryHighlight';

export const PriorityPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    priorityQueue,
    simulateCollection,
    isLoading,
    refreshData,
    setSelectedBinId
  } = useMunicipal();

  const [expandedBinId, setExpandedBinId] = useState<string | null>(null);
  const [confirmingBinId, setConfirmingBinId] = useState<string | null>(null);
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<{ binId: string; text: string } | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<{ binId: string; text: string } | null>(null);
  
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Check connection to backend API
  useEffect(() => {
    let isMounted = true;
    const verifyApi = async () => {
      try {
        const res = await fetch('/api/v1/priority');
        if (!res.ok) {
          throw new Error(`Backend service returned HTTP ${res.status}`);
        }
        if (isMounted) setApiError(null);
      } catch (err: any) {
        if (isMounted) {
          setApiError(err.message || 'Unable to connect to municipal backend service');
        }
      }
    };
    verifyApi();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setApiError(null);

    try {
      const res = await fetch('/api/v1/priority');
      if (!res.ok) {
        throw new Error(`Backend service returned HTTP ${res.status}`);
      }
      await refreshData();
      setApiError(null);
    } catch (err: any) {
      setApiError(err.message || 'Failed to refresh queue from backend');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleCard = (binId: string) => {
    setExpandedBinId((prev) => (prev === binId ? null : binId));
    setConfirmingBinId(null);
    setActionErrorMsg(null);
  };

  const handleDispatchCollection = async (bin: Bin) => {
    if (bin.data_source === 'REAL') {
      return;
    }

    setCollectingId(bin.bin_id);
    setActionErrorMsg(null);
    try {
      await simulateCollection(bin.bin_id);
      setActionSuccessMsg({ binId: bin.bin_id, text: `Dispatch successful. ${bin.bin_id} collection simulated.` });
      setConfirmingBinId(null);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      setActionErrorMsg({ binId: bin.bin_id, text: err.message || 'Dispatch failed' });
    } finally {
      setCollectingId(null);
    }
  };

  const handleViewOnMap = (bin: Bin) => {
    setSelectedBinId(bin.bin_id);
    navigate('/map');
  };

  const handleViewDetails = (bin: Bin) => {
    setSelectedBinId(bin.bin_id);
    navigate(`/bins/${bin.bin_id}`);
  };

  // Actual summary counts calculated from current bin data and priority rules
  const fullCount = priorityQueue.filter((b) => b.current_status === 'FULL').length;
  const highCount = priorityQueue.filter((b) => b.current_status === 'HIGH').length;

  const getStatusBadge = (status: string, isOnline: boolean) => {
    if (!isOnline) {
      return {
        bg: 'bg-[#F1F5F9]',
        text: 'text-[#64748B]',
        border: 'border-[#CBD5E1]',
        label: 'OFFLINE',
      };
    }

    switch (status) {
      case 'FULL':
        return {
          bg: 'bg-[#FEF2F2]',
          text: 'text-[#E54855]',
          border: 'border-[#FCA5A5]',
          label: 'FULL',
        };
      case 'HIGH':
        return {
          bg: 'bg-[#FFF7ED]',
          text: 'text-[#F07818]',
          border: 'border-[#FDBA74]',
          label: 'HIGH',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-[#FFFBEB]',
          text: 'text-[#D99A12]',
          border: 'border-[#FCD34D]',
          label: 'MEDIUM',
        };
      default:
        return {
          bg: 'bg-[#F0FDF4]',
          text: 'text-[#16A66A]',
          border: 'border-[#86EFAC]',
          label: 'LOW',
        };
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      if (isNaN(date.getTime())) return 'Recently';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="space-y-4 max-w-5xl mx-auto flex flex-col min-h-0">
      {/* ----------------- PAGE HEADER ----------------- */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0.05 : 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-5 py-4 rounded-2xl border border-[#DCE6F0] shadow-xs"
      >
        <div>
          <h1 className="text-xl font-bold text-[#142B45] flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-[#1689DF]" />
            <span>Municipal Collection Priority Queue</span>
          </h1>
          <p className="text-xs text-[#526985] mt-0.5">
            Bins ranked by collection urgency and fill percentage.
          </p>
        </div>

        {/* Immediate Dispatches and Warning Dispatches Badges */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-xs font-bold text-[#E54855] shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E54855]" />
            <span>{fullCount} Immediate Dispatches</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-[#FFF7ED] border border-[#FDBA74] text-xs font-bold text-[#F07818] shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F07818]" />
            <span>{highCount} Warning Dispatches</span>
          </div>
        </div>
      </motion.div>

      {/* ----------------- MAIN QUEUE CONTENT ----------------- */}
      <div className="relative">
        {/* 1. API Error State */}
        {apiError ? (
          <div className="bg-white rounded-[16px] border border-[#FCA5A5] p-8 sm:p-10 text-center shadow-xs flex flex-col items-center justify-center max-w-lg mx-auto space-y-3.5 my-6">
            <div className="w-10 h-10 rounded-full bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-center text-[#E54855] shadow-2xs">
              <AlertCircle className="w-5 h-5 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#142B45]">
                Failed to load collection queue
              </h3>
              <p className="text-xs text-[#E54855] leading-relaxed max-w-md">
                {apiError}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#E54855] hover:bg-[#DC2626] rounded-xl transition-all cursor-pointer shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-[#E54855] active:scale-[0.98]"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Retrying...' : 'Retry Connection'}</span>
            </button>
          </div>
        ) : isLoading && priorityQueue.length === 0 ? (
          /* 2. Loading State */
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[#DCE6F0] p-4 animate-pulse flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 bg-slate-100 rounded" />
                    <div className="h-3 w-44 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-12 bg-slate-100 rounded" />
                  <div className="h-6 w-16 bg-slate-100 rounded" />
                  <div className="w-4 h-4 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : priorityQueue.length === 0 ? (
          /* 3. Empty Queue State */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-[16px] border border-[#DCE6F0] p-8 sm:p-10 text-center shadow-xs flex flex-col items-center justify-center max-w-lg mx-auto space-y-3.5 my-6"
          >
            <div className="w-10 h-10 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#16A66A] shadow-2xs">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#142B45]">
                No bins currently require collection.
              </h3>
              <p className="text-xs text-[#526985] leading-relaxed max-w-md">
                All municipal waste receptacles are currently within normal capacity limits. The priority queue dynamically updates as bins fill.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#1689DF] hover:text-[#0876C5] bg-[#F0F5FB] hover:bg-[#E1EFFE] border border-[#DCE6F0] rounded-xl transition-all cursor-pointer shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-[#1689DF] active:scale-[0.98]"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Queue'}</span>
            </button>
          </motion.div>
        ) : (
          /* 4. Compact, Clickable Priority Bin Cards */
          <div className="max-h-[calc(100vh-210px)] overflow-y-auto space-y-2.5 pr-1 sm:pr-1.5 pb-8 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
            {priorityQueue.map((bin, index) => {
              const isOnline = Boolean(bin.online);
              const statusCfg = getStatusBadge(bin.current_status, isOnline);
              const isReal = bin.data_source === 'REAL';
              const isExpanded = expandedBinId === bin.bin_id;
              const isConfirming = confirmingBinId === bin.bin_id;
              const isCollecting = collectingId === bin.bin_id;
              const successMsg = actionSuccessMsg?.binId === bin.bin_id ? actionSuccessMsg.text : null;
              const errorMsg = actionErrorMsg?.binId === bin.bin_id ? actionErrorMsg.text : null;

              return (
                <div
                  key={bin.bin_id}
                  className={`bg-white rounded-xl border transition-all duration-200 shadow-xs hover:shadow-md ${
                    isExpanded
                      ? 'border-[#1689DF] ring-1 ring-[#1689DF]/20'
                      : 'border-[#DCE6F0] hover:border-[#1689DF]/50 hover:-translate-y-0.5'
                  }`}
                >
                  {/* COLLAPSED ROW (Always visible, entirely clickable) */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-controls={`bin-details-${bin.bin_id}`}
                    onClick={() => handleToggleCard(bin.bin_id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleCard(bin.bin_id);
                      }
                    }}
                    className="p-3.5 sm:px-4.5 sm:py-3.5 flex items-center justify-between gap-3 cursor-pointer select-none outline-none group"
                  >
                    {/* Left: Rank, Bin ID, Location */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Priority Rank */}
                      <span className="font-mono text-xs font-bold text-[#526985] shrink-0 w-6">
                        #{index + 1}
                      </span>

                      {/* Bin ID */}
                      <span className="font-bold text-sm text-[#142B45] tracking-tight shrink-0 group-hover:text-[#1689DF] transition-colors">
                        {bin.bin_id}
                      </span>

                      <span className="text-[#CBD5E1] shrink-0">–</span>

                      {/* Location Name */}
                      <span className="text-xs sm:text-sm font-medium text-[#526985] truncate">
                        {bin.location || bin.name}
                      </span>
                    </div>

                    {/* Right: Fill %, Status Badge, Chevron */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Fill Percentage */}
                      <TelemetryHighlight value={bin.current_fill_percent}>
                        <span className="text-base sm:text-lg font-bold font-mono text-[#142B45]">
                          {bin.current_fill_percent}%
                        </span>
                      </TelemetryHighlight>

                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        {statusCfg.label}
                      </span>

                      {/* Rotating Chevron */}
                      <ChevronDown
                        className={`w-4 h-4 text-[#526985] transition-transform duration-200 shrink-0 ${
                          isExpanded ? 'rotate-180 text-[#1689DF]' : 'group-hover:text-[#1689DF]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* EXPANDED DETAILS & CLEAR ACTIONS PANEL */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        id={`bin-details-${bin.bin_id}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{
                          duration: prefersReducedMotion ? 0.05 : 0.2,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="overflow-hidden border-t border-[#F1F5F9] bg-[#FAFBFD] rounded-b-xl"
                      >
                        <div className="p-4 sm:p-5 space-y-4">
                          {/* Feedback Messages */}
                          {successMsg && (
                            <div className="p-2.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs font-semibold text-[#16A66A] flex items-center gap-2">
                              <Check className="w-4 h-4 shrink-0" />
                              <span>{successMsg}</span>
                            </div>
                          )}

                          {errorMsg && (
                            <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] text-xs font-semibold text-[#E54855] flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{errorMsg}</span>
                            </div>
                          )}

                          {/* Secondary Metadata Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            {/* Area / Ward */}
                            <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] space-y-0.5">
                              <span className="text-[10px] text-[#64748B] uppercase font-bold block tracking-wider">
                                Area &amp; Ward
                              </span>
                              <span className="font-semibold text-[#142B45] truncate block">
                                {bin.ward || 'Ward Central'} {bin.zone ? `• ${bin.zone}` : ''}
                              </span>
                            </div>

                            {/* Distance */}
                            <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] space-y-0.5">
                              <span className="text-[10px] text-[#64748B] uppercase font-bold block tracking-wider">
                                Sensor Distance
                              </span>
                              <span className="font-semibold font-mono text-[#142B45] block">
                                {bin.current_distance_cm} cm
                              </span>
                            </div>

                            {/* Connectivity */}
                            <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] space-y-0.5">
                              <span className="text-[10px] text-[#64748B] uppercase font-bold block tracking-wider">
                                Connection
                              </span>
                              <div className="flex items-center gap-1.5 font-semibold text-[#142B45]">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isOnline ? 'bg-[#16A66A]' : 'bg-[#94A3B8]'
                                  }`}
                                />
                                <span>{isOnline ? 'Online' : 'Offline'}</span>
                              </div>
                            </div>

                            {/* Last Telemetry Update */}
                            <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] space-y-0.5">
                              <span className="text-[10px] text-[#64748B] uppercase font-bold block tracking-wider">
                                Last Telemetry
                              </span>
                              <span className="font-semibold font-mono text-[#142B45] block">
                                {formatTimestamp(bin.last_seen)}
                              </span>
                            </div>
                          </div>

                          {/* Data Source Notice for Real Hardware vs Demo Fleet */}
                          <div className="flex items-center justify-between text-xs py-1">
                            <div className="flex items-center gap-1.5 text-[#526985]">
                              {isReal ? (
                                <>
                                  <Cpu className="w-3.5 h-3.5 text-[#1689DF]" />
                                  <span>
                                    <strong className="text-[#142B45]">Real Physical Hardware:</strong> Telemetry updates via ESP32-CAM and clears automatically when waste is collected.
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Radio className="w-3.5 h-3.5 text-[#F07818]" />
                                  <span>
                                    <strong className="text-[#142B45]">Demo Fleet Device:</strong> Simulated accumulation for municipal operations demonstration.
                                  </span>
                                </>
                              )}
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                                isReal
                                  ? 'bg-[#EBF5FF] text-[#1689DF] border-[#CDE2F5]'
                                  : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                              }`}
                            >
                              {isReal ? 'REAL HARDWARE' : 'DEMO'}
                            </span>
                          </div>

                          {/* ACTION BUTTONS ROW */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#E2E8F0]">
                            {/* Left actions: Map & Details Navigation */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleViewOnMap(bin)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#DCE6F0] text-xs font-bold text-[#142B45] hover:border-[#1689DF] hover:text-[#1689DF] transition-all cursor-pointer shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-[#1689DF] active:scale-[0.98]"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                <span>View on Map</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleViewDetails(bin)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#DCE6F0] text-xs font-bold text-[#142B45] hover:border-[#1689DF] hover:text-[#1689DF] transition-all cursor-pointer shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-[#1689DF] active:scale-[0.98]"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Bin Details</span>
                              </button>
                            </div>

                            {/* Right action: Collection Dispatch */}
                            <div>
                              {isReal ? (
                                <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F0F5FB] text-[#1689DF] border border-[#DCE6F0] text-xs font-bold select-none">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Hardware Auto-Clears</span>
                                </div>
                              ) : isConfirming ? (
                                <div className="inline-flex items-center gap-2">
                                  <span className="text-xs text-[#526985]">Confirm dispatch?</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDispatchCollection(bin)}
                                    disabled={isCollecting}
                                    className="px-3 py-1.5 bg-[#1689DF] hover:bg-[#0876C5] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                                  >
                                    {isCollecting ? 'Dispatching...' : 'Yes, Dispatch'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmingBinId(null)}
                                    className="px-2.5 py-1.5 bg-white border border-[#DCE6F0] text-[#526985] hover:text-[#142B45] rounded-lg text-xs font-bold transition-all cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmingBinId(bin.bin_id)}
                                  disabled={isCollecting}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1689DF] hover:bg-[#0876C5] disabled:bg-[#93C5FD] text-white text-xs font-bold transition-all cursor-pointer shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1689DF] active:scale-[0.98]"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>Dispatch Collection</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
