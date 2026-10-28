import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useMunicipal } from '../context/MunicipalContext';
import {
  Bell,
  Trash2,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  X,
  MapPin,
  Activity,
  Radio,
  Cpu
} from 'lucide-react';
import { Alert } from '../types';

export const AlertsPage: React.FC = () => {
  const {
    alerts,
    bins,
    resolveAlert,
    refreshData,
    isLoading,
    setSelectedBinId,
    selectedBinHistory
  } = useMunicipal();

  // Filter: 'ALL' | 'CRITICAL' | 'WARNING' | 'RESOLVED'
  const [filter, setFilter] = useState<string>('ALL');

  // Details Drawer state
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Action states
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [confirmResolveId, setConfirmResolveId] = useState<string | null>(null);

  // Active (unresolved) vs Resolved alerts
  const activeAlerts = useMemo(() => alerts.filter((a) => !a.resolved), [alerts]);
  const resolvedAlerts = useMemo(() => alerts.filter((a) => a.resolved), [alerts]);

  const criticalCount = activeAlerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = activeAlerts.filter((a) => a.severity === 'WARNING').length;

  // Selected Alert Object
  const selectedAlert = useMemo(() => {
    if (!selectedAlertId) return null;
    return alerts.find((a) => a.id === selectedAlertId) || null;
  }, [selectedAlertId, alerts]);

  // Selected Alert Bin Object
  const selectedAlertBin = useMemo(() => {
    if (!selectedAlert) return null;
    return bins.find((b) => b.bin_id === selectedAlert.bin_id) || null;
  }, [selectedAlert, bins]);

  // Filtered alerts list
  const displayedAlerts = useMemo(() => {
    if (filter === 'RESOLVED') {
      return resolvedAlerts;
    }
    if (filter === 'CRITICAL') {
      return activeAlerts.filter((a) => a.severity === 'CRITICAL');
    }
    if (filter === 'WARNING') {
      return activeAlerts.filter((a) => a.severity === 'WARNING');
    }
    return activeAlerts;
  }, [filter, activeAlerts, resolvedAlerts]);

  // Handle open drawer
  const handleOpenDrawer = (alert: Alert) => {
    setSelectedAlertId(alert.id);
    setSelectedBinId(alert.bin_id);
    setDrawerOpen(true);
  };

  // Handle Acknowledge & Resolve
  const handleResolve = async (alertId: string) => {
    setResolvingId(alertId);
    try {
      await resolveAlert(alertId);
      setConfirmResolveId(null);
      await refreshData();
    } catch (err) {
      console.error('Error resolving alert:', err);
    } finally {
      setResolvingId(null);
    }
  };

  // Helper to format short explanation
  const getShortExplanation = (alert: Alert): string => {
    if (alert.severity === 'CRITICAL' || alert.alert_type === 'FULL') {
      return 'Urgent collection required.';
    }
    if (alert.severity === 'WARNING' || alert.alert_type === 'HIGH') {
      return 'Approaching capacity threshold.';
    }
    if (alert.alert_type === 'OFFLINE') {
      return 'Sensor heartbeat missed.';
    }
    return alert.message || 'Inspection recommended.';
  };

  // Helper to format timestamp
  const formatTime = (isoString?: string) => {
    if (!isoString) return '23:00';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen bg-[#EFF5FC] -mx-4 sm:-mx-6 -my-6 px-4 sm:px-8 py-7 font-sans">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ================= 1. PAGE HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] font-bold text-[#1689DF] tracking-wider uppercase flex items-center gap-1.5 mb-1">
              <Layers className="w-3.5 h-3.5 text-[#1689DF]" />
              <span>ALERTS &amp; NOTIFICATIONS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#142B45]">
              Municipal Live Alerts
            </h1>
            <p className="text-xs sm:text-sm text-[#647A98] mt-0.5">
              Monitor bin capacity and collection warnings.
            </p>
          </div>

          {/* Compact Critical & Warning Count Badges (Orange & Yellow) */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* Critical Badge: Orange */}
            <div className="px-3.5 py-1.5 rounded-full bg-white border border-[#FED7AA] shadow-xs flex items-center gap-2 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] animate-pulse" />
              <span className="text-[#EA580C] font-bold">{criticalCount} Critical</span>
            </div>

            {/* Warning Badge: Yellow/Amber */}
            <div className="px-3.5 py-1.5 rounded-full bg-white border border-[#FEF08A] shadow-xs flex items-center gap-2 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
              <span className="text-[#CA8A04] font-bold">{warningCount} Warning</span>
            </div>
          </div>
        </div>

        {/* ================= 2. COMPACT FILTER TOOLBAR ================= */}
        <div className="bg-white rounded-2xl border border-[#D9E5F2] p-2 sm:p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto p-0.5">
            {[
              { id: 'ALL', label: `All Active (${activeAlerts.length})` },
              { id: 'CRITICAL', label: `Critical (${criticalCount})` },
              { id: 'WARNING', label: `Warning (${warningCount})` },
              { id: 'RESOLVED', label: `Resolved History (${resolvedAlerts.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                  filter === tab.id
                    ? 'bg-[#142B45] text-white shadow-xs'
                    : 'bg-white text-[#647A98] hover:text-[#142B45] hover:bg-[#F0F5FB] border border-[#D9E5F2]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => refreshData()}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#1689DF] hover:bg-[#EAF4FF] transition-colors cursor-pointer flex items-center gap-1.5"
            title="Refresh alert feed"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* ================= 3. ALERT CARDS LIST ================= */}
        {displayedAlerts.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-[#D9E5F2] p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF4FF] text-[#1689DF] flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-[#142B45]">
              {filter === 'RESOLVED' ? 'No resolved alerts in history' : 'No active alerts'}
            </h3>
            <p className="text-xs text-[#647A98] mt-1 max-w-sm mx-auto">
              {filter === 'RESOLVED'
                ? 'Resolved alerts and cleared collection incidents will appear here.'
                : 'All municipal dustbins are within normal capacity limits.'}
            </p>
            {filter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                className="mt-4 px-3.5 py-1.5 rounded-xl bg-[#142B45] text-white text-xs font-semibold hover:bg-[#1689DF] transition-colors cursor-pointer"
              >
                Show All Active Alerts
              </button>
            )}
          </div>
        ) : (
          /* Alert Cards */
          <div className="space-y-3">
            {displayedAlerts.map((alert) => {
              const bin = bins.find((b) => b.bin_id === alert.bin_id);
              const isCritical = alert.severity === 'CRITICAL';
              const fillPercent = alert.fill_percent ?? bin?.current_fill_percent ?? (isCritical ? 93 : 84);
              const locationText = bin?.location || bin?.name || 'Main Road';
              const wardText = bin?.ward || 'Ward 02';

              return (
                <div
                  key={alert.id}
                  onClick={() => handleOpenDrawer(alert)}
                  className={`bg-white rounded-2xl border shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer overflow-hidden ${
                    alert.resolved
                      ? 'border-[#D9E5F2] opacity-80'
                      : isCritical
                      ? 'border-[#D9E5F2] border-l-4 border-l-[#F97316]'
                      : 'border-[#D9E5F2] border-l-4 border-l-[#EAB308]'
                  }`}
                >
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                    {/* Left: Bin Icon Box + Identity */}
                    <div className="flex items-center gap-3.5 min-w-[200px]">
                      <div className="w-10 h-10 rounded-xl bg-[#EAF4FF] text-[#1689DF] border border-[#BCE0FD] flex items-center justify-center shrink-0 shadow-2xs">
                        <Trash2 className="w-5 h-5" />
                      </div>

                      <div>
                        <span className="font-mono text-base font-bold text-[#142B45] block leading-tight">
                          {alert.bin_id}
                        </span>
                        <span className="text-xs text-[#647A98] mt-0.5 block truncate">
                          {locationText}, {wardText}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Fill % · Severity Badge · Explanation · Timestamp */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* Fill Percentage: Orange for Critical, Yellow for Warning */}
                        <span
                          className={`font-mono text-sm font-bold ${
                            isCritical ? 'text-[#F97316]' : 'text-[#CA8A04]'
                          }`}
                        >
                          {fillPercent}% full
                        </span>

                        <span className="text-[#CBD5E1]">&bull;</span>

                        {/* Severity Badge: Orange for Critical, Yellow for Warning */}
                        <span
                          className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            alert.resolved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isCritical
                              ? 'bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA]'
                              : 'bg-[#FEFCE8] text-[#CA8A04] border border-[#FEF08A]'
                          }`}
                        >
                          {alert.resolved ? 'RESOLVED' : alert.severity}
                        </span>
                      </div>

                      {/* Explanation */}
                      <p className="text-xs text-[#647A98] leading-tight">
                        {getShortExplanation(alert)}
                      </p>

                      {/* Metadata Line */}
                      <div className="flex items-center gap-2 pt-0.5 text-[11px] text-[#8192A8] font-mono">
                        <Clock className="w-3 h-3 text-[#94A3B8]" />
                        <span>Alert triggered: {formatTime(alert.created_at)}</span>
                        <span className="text-[#CBD5E1]">&bull;</span>
                        <span className="text-[#1689DF] font-semibold">
                          {alert.data_source === 'REAL' ? 'Real IoT Node' : 'Simulated Fleet'}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {/* View Bin */}
                      <Link
                        to={`/bins/${alert.bin_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#142B45] hover:text-[#168BE0] bg-white hover:bg-[#EFF5FC] border border-[#D8E5F3] transition-colors flex items-center gap-1 cursor-pointer active:scale-[0.98]"
                      >
                        <span>View Bin</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      {/* Acknowledge */}
                      {!alert.resolved ? (
                        confirmResolveId === alert.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              disabled={resolvingId === alert.id}
                              onClick={() => handleResolve(alert.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-xs active:scale-[0.98]"
                            >
                              <Check className="w-3 h-3" />
                              <span>Confirm</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmResolveId(null)}
                              className="px-2 py-1.5 text-xs text-[#587294] hover:text-[#142B45] underline cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmResolveId(alert.id);
                            }}
                            className="px-4 py-1.5 rounded-xl bg-[#142B45] hover:bg-[#168BE0] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
                          >
                            Acknowledge
                          </button>
                        )
                      ) : (
                        <span className="px-2.5 py-1 text-xs text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Cleared</span>
                        </span>
                      )}

                      {/* Details Chevron Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDrawer(alert);
                        }}
                        className="w-8 h-8 rounded-full border border-[#D8E5F3] bg-white hover:bg-[#EAF4FF] text-[#168BE0] flex items-center justify-center transition-colors cursor-pointer active:scale-[0.98]"
                        title="Open alert details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ================= 4. RIGHT-SIDE DETAILS DRAWER ================= */}
      <AnimatePresence>
        {drawerOpen && selectedAlert && (
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

            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 border-l border-[#D9E5F2]"
            >
              {/* Header */}
              <div className="px-6 py-4.5 border-b border-[#EDF2F8] flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      selectedAlert.severity === 'CRITICAL'
                        ? 'bg-[#FFF7ED] text-[#EA580C]'
                        : 'bg-[#FEFCE8] text-[#CA8A04]'
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#647A98] uppercase">
                      ALERT TELEMETRY AUDIT
                    </span>
                    <h3 className="text-base font-bold text-[#142B45] leading-snug flex items-center gap-2">
                      <span>{selectedAlert.bin_id}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          selectedAlert.severity === 'CRITICAL'
                            ? 'bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA]'
                            : 'bg-[#FEFCE8] text-[#CA8A04] border border-[#FEF08A]'
                        }`}
                      >
                        {selectedAlert.severity}
                      </span>
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-[#647A98] hover:text-[#142B45] hover:bg-[#F0F5FB] transition-colors cursor-pointer"
                  title="Close alert drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* 1. Primary Metrics Card */}
                <div
                  className={`p-4.5 rounded-2xl border ${
                    selectedAlert.severity === 'CRITICAL'
                      ? 'bg-[#FFF7ED]/50 border-[#FED7AA]'
                      : 'bg-[#FEFCE8]/50 border-[#FEF08A]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#647A98] uppercase">
                        RECORDED CAPACITY
                      </span>
                      <div
                        className={`text-3xl font-mono font-bold mt-0.5 ${
                          selectedAlert.severity === 'CRITICAL' ? 'text-[#F97316]' : 'text-[#CA8A04]'
                        }`}
                      >
                        {selectedAlert.fill_percent ?? selectedAlertBin?.current_fill_percent ?? 90}%
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono font-bold text-[#647A98] uppercase">
                        SENSOR DISTANCE
                      </span>
                      <div className="text-2xl font-mono font-bold text-[#142B45] mt-0.5">
                        {selectedAlertBin?.current_distance_cm !== undefined
                          ? `${selectedAlertBin.current_distance_cm} cm`
                          : '8.4 cm'}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#142B45] font-medium mt-3 pt-3 border-t border-[#EDF2F8]/80">
                    {getShortExplanation(selectedAlert)}
                  </p>
                </div>

                {/* 2. Location & Source */}
                <div className="bg-white border border-[#D9E5F2] p-4.5 rounded-2xl space-y-3 shadow-2xs">
                  <span className="text-xs font-bold text-[#142B45] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#1689DF]" />
                    <span>Location &amp; Source Details</span>
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#F8FAFC]">
                      <span className="text-[10px] font-mono text-[#647A98] uppercase block">Location</span>
                      <span className="font-semibold text-[#142B45] mt-0.5 block truncate">
                        {selectedAlertBin?.location || selectedAlertBin?.name || 'Main Road'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#F8FAFC]">
                      <span className="text-[10px] font-mono text-[#647A98] uppercase block">Ward</span>
                      <span className="font-semibold text-[#142B45] mt-0.5 block">
                        {selectedAlertBin?.ward || 'Ward 02'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#F8FAFC]">
                      <span className="text-[10px] font-mono text-[#647A98] uppercase block">Hardware Channel</span>
                      <span className="font-semibold text-[#1689DF] mt-0.5 block">
                        {selectedAlert.data_source === 'REAL' ? 'Physical HC-SR04' : 'Virtual Fleet'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#F8FAFC]">
                      <span className="text-[10px] font-mono text-[#647A98] uppercase block">Timestamp</span>
                      <span className="font-mono text-[#142B45] mt-0.5 block">
                        {selectedAlert.created_at ? new Date(selectedAlert.created_at).toLocaleTimeString() : '23:00'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Recent Telemetry Records */}
                <div className="bg-white border border-[#D9E5F2] p-4.5 rounded-2xl space-y-2.5 shadow-2xs">
                  <span className="text-xs font-bold text-[#142B45] flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#1689DF]" />
                    <span>Recent Sensor Readings</span>
                  </span>

                  {selectedBinHistory && selectedBinHistory.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedBinHistory.slice(-4).reverse().map((rec) => (
                        <div
                          key={rec.id}
                          className="p-2 rounded-xl bg-[#F8FAFC] border border-[#EDF2F8] text-xs flex items-center justify-between font-mono"
                        >
                          <span className="text-[#647A98]">{new Date(rec.recorded_at).toLocaleTimeString()}</span>
                          <span className="font-bold text-[#142B45]">{rec.distance_cm} cm</span>
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                              rec.fill_percent >= 90
                                ? 'bg-[#FFF7ED] text-[#EA580C]'
                                : rec.fill_percent >= 80
                                ? 'bg-[#FEFCE8] text-[#CA8A04]'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {rec.fill_percent}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#8192A8] italic">No prior telemetry log stored for this cycle.</p>
                  )}
                </div>

                {/* 4. Action Buttons */}
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    to={`/bins/${selectedAlert.bin_id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#EFF5FC] hover:bg-[#EAF4FF] text-[#168BE0] border border-[#D8E5F3] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-[0.98]"
                  >
                    <span>View Full Bin Telemetry Diagnostics</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  {!selectedAlert.resolved && (
                    <button
                      type="button"
                      disabled={resolvingId === selectedAlert.id}
                      onClick={() => handleResolve(selectedAlert.id)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#142B45] hover:bg-[#168BE0] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      <Check className="w-4 h-4" />
                      <span>Acknowledge &amp; Clear Alert</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[#EDF2F8] bg-[#F8FAFC] flex items-center justify-between shrink-0">
                <span className="text-[11px] font-mono text-[#647A98]">
                  Alert ID: {selectedAlert.id}
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
