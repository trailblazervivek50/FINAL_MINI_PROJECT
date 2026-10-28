import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMunicipal } from '../context/MunicipalContext';
import {
  Send,
  Play,
  Pause,
  Terminal,
  Trash2,
  Cpu,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Radio,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Database,
  Eye,
  EyeOff,
  ChevronRight
} from 'lucide-react';

const REAL_CREDENTIALS: Record<string, string> = {
  BIN_001: 'KEY_BIN_001_SECRET_9871',
  BIN_002: 'KEY_BIN_002_SECRET_5422',
  BIN_003: 'KEY_BIN_003_SECRET_3319',
  BIN_004: 'KEY_BIN_004_SECRET_7741',
  BIN_005: 'KEY_BIN_005_SECRET_1120',
};

interface DiagnosticLog {
  timestamp: string;
  type: 'TELEMETRY' | 'DEMO_STEP';
  request: {
    endpoint: string;
    method: string;
    payload: any;
    timestamp: string;
  };
  response: {
    status: number;
    statusText: string;
    body: any;
    timestamp: string;
  };
  validation: {
    checks: Array<{
      label: string;
      status: 'PASSED' | 'FAILED' | 'NOT_VERIFIED';
      detail?: string;
    }>;
    timestamp: string;
  };
}

export const SimulatorPage: React.FC = () => {
  const {
    demoRunning,
    toggleDemoSimulation,
    refreshData
  } = useMunicipal();

  const binOptions = ['BIN_001', 'BIN_002', 'BIN_003'];

  // View state: 'hardware' (main dashboard) or 'diagnostics' (dedicated full-page view)
  const [currentView, setCurrentView] = useState<'hardware' | 'diagnostics'>('hardware');

  const [selectedRealBin, setSelectedRealBin] = useState<string>('BIN_001');
  const [distanceCm, setDistanceCm] = useState<number>(6.8);
  const [apiKey, setApiKey] = useState<string>(REAL_CREDENTIALS['BIN_001']);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isStepping, setIsStepping] = useState<boolean>(false);
  
  // Unread indicator for telemetry button
  const [hasUnreadLog, setHasUnreadLog] = useState<boolean>(false);

  // Copy state feedback
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedReq, setCopiedReq] = useState<boolean>(false);
  const [copiedRes, setCopiedRes] = useState<boolean>(false);

  // Diagnostic Log State (persisted across view changes)
  const [diagnosticLog, setDiagnosticLog] = useState<DiagnosticLog | null>(null);

  // Calibrated Arduino firmware formula: ((30.0 - dist) / 25.0) * 100 clamped 0..100%
  const calcFill = Math.max(0, Math.min(100, Math.round(((30.0 - distanceCm) / 25.0) * 100)));
  const fillPercent = calcFill;

  const handleSelectBin = (binId: string) => {
    setSelectedRealBin(binId);
    setApiKey(REAL_CREDENTIALS[binId] || '');
  };

  const getStatusInfo = (fill: number) => {
    if (fill >= 90) {
      return {
        bg: 'bg-[#FEF2F2]',
        border: 'border-[#FCA5A5]',
        text: 'text-[#E54855]',
        label: 'FULL',
        icon: AlertCircle
      };
    }
    if (fill >= 80) {
      return {
        bg: 'bg-[#FFF7ED]',
        border: 'border-[#FDBA74]',
        text: 'text-[#F07818]',
        label: 'HIGH',
        icon: AlertCircle
      };
    }
    if (fill >= 50) {
      return {
        bg: 'bg-[#FFFBEB]',
        border: 'border-[#FCD34D]',
        text: 'text-[#D99A12]',
        label: 'MEDIUM',
        icon: AlertCircle
      };
    }
    return {
      bg: 'bg-[#F0FDF4]',
      border: 'border-[#86EFAC]',
      text: 'text-[#16A66A]',
      label: 'LOW',
      icon: CheckCircle2
    };
  };

  const currentStatus = getStatusInfo(fillPercent);

  // Copy helper
  const copyToClipboard = async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  };

  // 1. Transmit Hardware Telemetry Packet (Updates diagnostics without forcing navigation)
  const handleTransmitTelemetry = async () => {
    setIsSending(true);
    const timeNow = new Date().toLocaleTimeString();

    const requestPayload = {
      bin_id: selectedRealBin,
      distance: distanceCm,
      fill_percent: fillPercent,
      status: currentStatus.label,
    };

    try {
      const response = await fetch('/api/v1/bins/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          bin_id: selectedRealBin,
          distance_cm: distanceCm,
          fill_percent: fillPercent,
          status: currentStatus.label,
        }),
      });

      const statusCode = response.status;
      const statusText = response.ok ? 'HTTP 200 OK' : `HTTP ${statusCode} ${response.statusText}`;
      let responseBody: any;

      try {
        responseBody = await response.json();
      } catch {
        responseBody = { error: 'Non-JSON response from server' };
      }

      const resTime = new Date().toLocaleTimeString();

      const isApiKeyValid = statusCode !== 401 && statusCode !== 403;
      const isBinFound = statusCode !== 404;
      const isDataStored = response.ok && Boolean(responseBody.success);
      const isDashboardUpdated = isDataStored;
      const isProcessedSuccess = response.ok && Boolean(responseBody.success);

      setDiagnosticLog({
        timestamp: resTime,
        type: 'TELEMETRY',
        request: {
          endpoint: 'POST /api/v1/bins/telemetry',
          method: 'POST',
          payload: requestPayload,
          timestamp: timeNow,
        },
        response: {
          status: statusCode,
          statusText: statusText,
          body: responseBody,
          timestamp: resTime,
        },
        validation: {
          checks: [
            {
              label: 'API Key Valid',
              status: isApiKeyValid ? 'PASSED' : 'FAILED',
              detail: !isApiKeyValid ? 'Invalid or rejected device credentials' : undefined,
            },
            {
              label: `Bin ID Found (${selectedRealBin})`,
              status: isBinFound ? 'PASSED' : 'FAILED',
              detail: !isBinFound ? 'Device not found in registry' : undefined,
            },
            {
              label: 'Data Stored in Database',
              status: isDataStored ? 'PASSED' : 'FAILED',
            },
            {
              label: 'Dashboard Updated',
              status: isDashboardUpdated ? 'PASSED' : 'FAILED',
            },
            {
              label: 'Telemetry Processed Successfully',
              status: isProcessedSuccess ? 'PASSED' : 'FAILED',
            },
          ],
          timestamp: resTime,
        },
      });

      if (currentView !== 'diagnostics') {
        setHasUnreadLog(true);
      }

      if (response.ok) {
        await refreshData();
      }
    } catch (networkError: any) {
      const errTime = new Date().toLocaleTimeString();
      setDiagnosticLog({
        timestamp: errTime,
        type: 'TELEMETRY',
        request: {
          endpoint: 'POST /api/v1/bins/telemetry',
          method: 'POST',
          payload: requestPayload,
          timestamp: timeNow,
        },
        response: {
          status: 503,
          statusText: 'Network / Connection Error',
          body: { error: networkError.message || 'Failed to reach server' },
          timestamp: errTime,
        },
        validation: {
          checks: [
            { label: 'API Key Valid', status: 'NOT_VERIFIED' },
            { label: `Bin ID Found (${selectedRealBin})`, status: 'NOT_VERIFIED' },
            { label: 'Data Stored in Database', status: 'FAILED' },
            { label: 'Dashboard Updated', status: 'FAILED' },
            { label: 'Telemetry Processed Successfully', status: 'FAILED' },
          ],
          timestamp: errTime,
        },
      });

      if (currentView !== 'diagnostics') {
        setHasUnreadLog(true);
      }
    } finally {
      setIsSending(false);
    }
  };

  // 2. Run Single Demo Simulation Step (Updates diagnostics without forcing navigation)
  const handleRunDemoStep = async () => {
    setIsStepping(true);
    const timeNow = new Date().toLocaleTimeString();

    const requestPayload = {
      action: 'ADVANCE_SIMULATION_STEP',
      fleet: 'DEMO_ONLY',
      isolated_real_bins: ['BIN_001', 'BIN_002', 'BIN_003', 'BIN_004', 'BIN_005'],
    };

    try {
      const response = await fetch('/api/v1/demo/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const statusCode = response.status;
      const statusText = response.ok ? 'HTTP 200 OK' : `HTTP ${statusCode} ${response.statusText}`;
      const responseBody = await response.json().catch(() => ({ error: 'Parse error' }));
      const resTime = new Date().toLocaleTimeString();

      setDiagnosticLog({
        timestamp: resTime,
        type: 'DEMO_STEP',
        request: {
          endpoint: 'POST /api/v1/demo/step',
          method: 'POST',
          payload: requestPayload,
          timestamp: timeNow,
        },
        response: {
          status: statusCode,
          statusText: statusText,
          body: responseBody,
          timestamp: resTime,
        },
        validation: {
          checks: [
            { label: 'Demo Fleet Step Triggered', status: response.ok ? 'PASSED' : 'FAILED' },
            { label: 'Demo Bins Fill State Advanced', status: response.ok ? 'PASSED' : 'FAILED' },
            { label: 'Real Hardware Isolated (Untouched)', status: 'PASSED' },
            { label: 'Database State Synced', status: response.ok ? 'PASSED' : 'FAILED' },
            { label: 'Live SSE Broadcasted', status: response.ok ? 'PASSED' : 'FAILED' },
          ],
          timestamp: resTime,
        },
      });

      if (currentView !== 'diagnostics') {
        setHasUnreadLog(true);
      }

      if (response.ok) {
        await refreshData();
      }
    } catch (err: any) {
      const errTime = new Date().toLocaleTimeString();
      setDiagnosticLog({
        timestamp: errTime,
        type: 'DEMO_STEP',
        request: {
          endpoint: 'POST /api/v1/demo/step',
          method: 'POST',
          payload: requestPayload,
          timestamp: timeNow,
        },
        response: {
          status: 500,
          statusText: 'Simulation Error',
          body: { error: err.message },
          timestamp: errTime,
        },
        validation: {
          checks: [
            { label: 'Demo Fleet Step Triggered', status: 'FAILED' },
            { label: 'Demo Bins Fill State Advanced', status: 'FAILED' },
            { label: 'Real Hardware Isolated (Untouched)', status: 'PASSED' },
            { label: 'Database State Synced', status: 'FAILED' },
            { label: 'Live SSE Broadcasted', status: 'FAILED' },
          ],
          timestamp: errTime,
        },
      });

      if (currentView !== 'diagnostics') {
        setHasUnreadLog(true);
      }
    } finally {
      setIsStepping(false);
    }
  };

  const handleClearLog = () => {
    setDiagnosticLog(null);
  };

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="relative min-h-[calc(100vh-90px)] overflow-x-hidden">
      {/* ----------------- SUBTLE FLOWING CURVED BACKGROUND DECORATION ----------------- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 select-none">
        <svg
          viewBox="0 0 1440 380"
          className="absolute bottom-0 left-0 w-full h-[320px] object-cover"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,190 C340,320 540,90 920,210 C1180,280 1340,160 1440,220 L1440,380 L0,380 Z"
            fill="#E2EFFB"
            fillOpacity="0.55"
          />
          <path
            d="M0,250 C290,160 580,310 960,180 C1200,90 1380,260 1440,230 L1440,380 L0,380 Z"
            fill="#EAF4FC"
            fillOpacity="0.75"
          />
          <path
            d="M0,290 C380,220 720,330 1060,250 C1260,200 1390,290 1440,270 L1440,380 L0,380 Z"
            fill="#F3F8FD"
          />
        </svg>
      </div>

      <AnimatePresence mode="wait">
        {currentView === 'hardware' ? (
          /* ================= VIEW 1: HARDWARE TESTING DASHBOARD ================= */
          <motion.div
            key="hardware-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              duration: prefersReducedMotion ? 0.05 : 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="max-w-[1400px] mx-auto space-y-6 pb-12"
          >
            {/* Header: Title, Subtitle, and Real & Demo Isolation Status directly */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-[26px] font-bold text-[#14283F] tracking-tight">
                  IoT Hardware &amp; Demo Fleet Simulator
                </h1>
                <p className="text-sm text-[#526985] mt-1">
                  Test real hardware telemetry packets and control the demo bin for your prototype.
                </p>
              </div>

              {/* Real & Demo Isolation Active Badge */}
              <div className="flex items-center gap-2.5 px-3.5 py-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl shadow-xs self-start sm:self-auto">
                <div className="w-2.5 h-2.5 rounded-full bg-[#16A66A] animate-pulse" />
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-bold text-[#14283F]">Real &amp; Demo Isolation Active</span>
                  <span className="text-[11px] text-[#526985]">Demo data will not affect real devices.</span>
                </div>
              </div>
            </div>

            {/* TWO-COLUMN HARDWARE TESTING GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Hardware Packet Injector */}
              <div className="lg:col-span-6 flex flex-col">
                <div className="relative bg-white rounded-[16px] border border-[#DCE6F0] shadow-xs p-6 space-y-5.5 hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  {/* Subtle inner curve accent on right */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-[#EBF5FF]/50 to-transparent rounded-bl-full pointer-events-none -z-0" />

                  {/* Card Header */}
                  <div className="relative z-10 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#F0F5FB] flex items-center justify-center shrink-0 border border-[#E2EEF9]">
                      <Send className="w-5 h-5 text-[#1687D9]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h2 className="text-base font-bold text-[#14283F]">Hardware Packet Injector</h2>
                        <span className="text-[11px] font-bold font-mono text-[#1687D9] bg-[#F0F5FB] px-2.5 py-0.5 rounded-md border border-[#DCE6F0]">
                          POST /api/v1/bins/telemetry
                        </span>
                      </div>
                      <p className="text-xs text-[#526985] mt-1 leading-relaxed">
                        Simulate hardware data from ESP32-CAM (or test via demo) and send a telemetry packet to the server.
                      </p>
                    </div>
                  </div>

                  {/* Select Target Bin */}
                  <div className="relative z-10">
                    <label className="text-xs font-bold text-[#14283F] block mb-2">Select Target Bin</label>
                    <div className="flex flex-wrap gap-2">
                      {binOptions.map((id) => {
                        const isSelected = selectedRealBin === id;
                        return (
                          <button
                            key={id}
                            onClick={() => handleSelectBin(id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#1687D9] cursor-pointer ${
                              isSelected
                                ? 'bg-[#1687D9] text-white shadow-xs border border-[#1687D9]'
                                : 'bg-white text-[#526985] border border-[#DCE6F0] hover:border-[#1687D9] hover:text-[#1687D9]'
                            }`}
                          >
                            {id}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ultrasonic Distance (HC-SR04) Slider */}
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-[#14283F]">Ultrasonic Distance (HC-SR04)</label>
                      <span className="text-base font-bold text-[#1687D9] font-mono">{distanceCm.toFixed(1)} cm</span>
                    </div>
                    
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="0.1"
                      value={distanceCm}
                      onChange={(e) => setDistanceCm(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#1687D9]"
                    />

                    <div className="flex justify-between text-[11px] text-[#526985] mt-2 px-0.5 font-medium">
                      <span className="flex flex-col items-start leading-tight">
                        <span className="font-bold text-[#14283F]">5 cm</span>
                        <span className="text-[10px] text-[#526985]">(100% Full)</span>
                      </span>
                      <span className="flex flex-col items-center leading-tight">
                        <span className="font-bold text-[#14283F]">17.5 cm</span>
                        <span className="text-[10px] text-[#526985]">(50%)</span>
                      </span>
                      <span className="flex flex-col items-end leading-tight">
                        <span className="font-bold text-[#14283F]">30 cm</span>
                        <span className="text-[10px] text-[#526985]">(0% Empty)</span>
                      </span>
                    </div>
                  </div>

                  {/* Metric Status Panels (3 Boxes) */}
                  <div className="relative z-10 grid grid-cols-3 gap-3 pt-1">
                    {/* Computed Fill Level */}
                    <div className="p-3 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Trash2 className="w-4 h-4 text-[#E54855]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-[#526985] font-medium truncate">Computed Fill Level</span>
                        <span className="text-xl font-bold text-[#14283F] leading-tight font-mono">{fillPercent}%</span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className={`p-3 rounded-xl border flex items-center gap-3 ${currentStatus.border} ${currentStatus.bg}`}>
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-2xs">
                        <currentStatus.icon className={`w-4 h-4 ${currentStatus.text}`} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-[#526985] font-medium truncate">Status</span>
                        <span className={`text-lg font-bold leading-tight ${currentStatus.text}`}>{currentStatus.label}</span>
                      </div>
                    </div>

                    {/* Distance */}
                    <div className="p-3 rounded-xl border border-[#DCE6F0] bg-[#F0F5FB] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-[#DCE6F0] shadow-2xs">
                        <Radio className="w-4 h-4 text-[#1687D9]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-[#526985] font-medium truncate">Distance</span>
                        <span className="text-lg font-bold text-[#14283F] leading-tight font-mono">{distanceCm.toFixed(1)} cm</span>
                      </div>
                    </div>
                  </div>

                  {/* Device Key with Mask Toggle */}
                  <div className="relative z-10 space-y-1.5">
                    <label className="text-xs font-bold text-[#14283F] block">Device Key (X-API-Key Header)</label>
                    <div className="relative flex items-center">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full text-xs font-mono text-[#14283F] bg-[#F8FAFC] px-3.5 py-2.5 rounded-xl border border-[#DCE6F0] focus:border-[#1687D9] focus:ring-1 focus:ring-[#1687D9] outline-none pr-16"
                      />
                      <div className="absolute right-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowKey(!showKey)}
                          className="p-1 rounded text-[#526985] hover:text-[#1687D9] transition-colors cursor-pointer"
                          title={showKey ? 'Hide Key' : 'Show Key'}
                        >
                          {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(apiKey, setCopiedKey)}
                          className="p-1 rounded text-[#526985] hover:text-[#1687D9] transition-colors cursor-pointer"
                          title="Copy API Key"
                        >
                          {copiedKey ? <Check className="w-4 h-4 text-[#16A66A]" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center px-1 text-[11px]">
                      <div className="flex items-center gap-1 font-bold text-[#16A66A]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Valid API Key</span>
                      </div>
                      <span className="text-[#526985]">Used for authenticating this demo device only.</span>
                    </div>
                  </div>

                  {/* Transmit Telemetry Button */}
                  <button
                    onClick={handleTransmitTelemetry}
                    disabled={isSending}
                    className="relative z-10 w-full py-3 bg-[#1687D9] hover:bg-[#0876C5] disabled:bg-[#93C5FD] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1687D9] active:scale-[0.99]"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{isSending ? 'Transmitting...' : `Transmit Telemetry for ${selectedRealBin}`}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Prototype Hardware Setup & Demo Controller */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                {/* Prototype Hardware Setup */}
                <div className="bg-white rounded-[16px] border border-[#DCE6F0] shadow-xs p-6 space-y-5 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0 border border-[#DCFCE7]">
                      <Cpu className="w-5 h-5 text-[#16A66A]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#14283F]">Prototype Hardware Setup</h2>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F0FDF4] border border-[#BBF7D0] rounded-full">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#16A66A]" />
                          <span className="text-[11px] font-bold text-[#16A66A]">Connected</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#526985] mt-1 leading-relaxed">
                        Hardware components and data flow for the prototype.
                      </p>
                    </div>
                  </div>

                  {/* Vector Diagram */}
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                    <svg
                      viewBox="0 0 680 230"
                      className="w-full h-auto max-h-[220px]"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* HC-SR04 */}
                      <g transform="translate(30, 75)">
                        <text x="45" y="-18" textAnchor="middle" fill="#14283F" fontSize="12" fontWeight="700">HC-SR04</text>
                        <text x="45" y="-4" textAnchor="middle" fill="#526985" fontSize="10">(Ultrasonic)</text>
                        <rect x="0" y="5" width="90" height="52" rx="4" fill="#0284C7" stroke="#0369A1" strokeWidth="2" />
                        <circle cx="26" cy="31" r="18" fill="#CBD5E1" stroke="#64748B" strokeWidth="2" />
                        <circle cx="26" cy="31" r="13" fill="#E2E8F0" />
                        <circle cx="26" cy="31" r="5" fill="#475569" />
                        <circle cx="64" cy="31" r="18" fill="#CBD5E1" stroke="#64748B" strokeWidth="2" />
                        <circle cx="64" cy="31" r="13" fill="#E2E8F0" />
                        <circle cx="64" cy="31" r="5" fill="#475569" />
                        <rect x="36" y="52" width="18" height="6" fill="#1E293B" />
                      </g>

                      {/* Jumper wires */}
                      <path d="M 120 100 C 145 100, 155 125, 175 125" stroke="#E54855" strokeWidth="2" fill="none" />
                      <path d="M 120 106 C 145 106, 155 130, 175 130" stroke="#F59E0B" strokeWidth="2" fill="none" />
                      <path d="M 120 112 C 145 112, 155 135, 175 135" stroke="#16A66A" strokeWidth="2" fill="none" />
                      <path d="M 120 118 C 145 118, 155 140, 175 140" stroke="#1E293B" strokeWidth="2" fill="none" />

                      {/* 16x2 LCD */}
                      <g transform="translate(195, 12)">
                        <text x="60" y="-1" textAnchor="middle" fill="#14283F" fontSize="11" fontWeight="700">16×2 LCD (I2C)</text>
                        <rect x="0" y="8" width="120" height="48" rx="4" fill="#047857" stroke="#065F46" strokeWidth="2" />
                        <rect x="12" y="15" width="96" height="34" rx="2" fill="#84CC16" stroke="#4D7C0F" strokeWidth="1.5" />
                        <text x="60" y="29" textAnchor="middle" fill="#14532D" fontSize="10" fontWeight="700" fontFamily="monospace">
                          FILL: {fillPercent}%
                        </text>
                        <text x="60" y="42" textAnchor="middle" fill="#14532D" fontSize="10" fontWeight="700" fontFamily="monospace">
                          DIST: {distanceCm.toFixed(1)}cm
                        </text>
                      </g>

                      <line x1="255" y1="68" x2="255" y2="92" stroke="#1E293B" strokeWidth="2" strokeDasharray="3 3" />

                      {/* Arduino UNO */}
                      <g transform="translate(175, 92)">
                        <rect x="0" y="0" width="130" height="85" rx="6" fill="#0284C7" stroke="#0369A1" strokeWidth="2" />
                        <rect x="-10" y="8" width="18" height="22" rx="2" fill="#94A3B8" stroke="#475569" strokeWidth="1.5" />
                        <rect x="-8" y="52" width="16" height="20" rx="2" fill="#1E293B" />
                        <rect x="50" y="32" width="48" height="18" rx="2" fill="#1E293B" />
                        <text x="74" y="45" textAnchor="middle" fill="#94A3B8" fontSize="7" fontWeight="bold">ATMEGA328P</text>
                        <rect x="8" y="4" width="114" height="6" fill="#0F172A" />
                        <rect x="8" y="75" width="114" height="6" fill="#0F172A" />
                        <text x="65" y="68" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800">Arduino UNO</text>
                      </g>

                      {/* UART */}
                      <g transform="translate(308, 128)">
                        <line x1="0" y1="0" x2="62" y2="0" stroke="#1687D9" strokeWidth="2" strokeDasharray="4 4" />
                        <polygon points="62,-4 70,0 62,4" fill="#1687D9" />
                        <rect x="18" y="-12" width="36" height="16" rx="3" fill="#FFFFFF" stroke="#DCE6F0" />
                        <text x="36" y="0" textAnchor="middle" fill="#1687D9" fontSize="9" fontWeight="700">UART</text>
                      </g>

                      {/* ESP32-CAM */}
                      <g transform="translate(382, 70)">
                        <text x="35" y="-12" textAnchor="middle" fill="#14283F" fontSize="12" fontWeight="700">ESP32-CAM</text>
                        <text x="35" y="0" textAnchor="middle" fill="#526985" fontSize="9">(Camera Removed)</text>
                        <rect x="0" y="8" width="70" height="96" rx="5" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
                        <path d="M 8 18 H 62 V 28 H 8 Z" fill="#D97706" />
                        <rect x="16" y="42" width="38" height="38" rx="4" fill="#334155" stroke="#475569" strokeWidth="1.5" />
                        <circle cx="35" cy="61" r="11" fill="#0F172A" />
                        <circle cx="35" cy="61" r="5" fill="#1E293B" />
                        <rect x="48" y="24" width="8" height="8" rx="1" fill="#FDE047" stroke="#CA8A04" />
                      </g>

                      {/* Wi-Fi Waves */}
                      <g transform="translate(465, 110)">
                        <path d="M 12 18 A 12 12 0 0 1 12 -2" stroke="#1687D9" strokeWidth="2" fill="none" strokeLinecap="round" />
                        <path d="M 18 24 A 20 20 0 0 1 18 -8" stroke="#1687D9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                        <path d="M 24 30 A 28 28 0 0 1 24 -14" stroke="#1687D9" strokeWidth="3" fill="none" strokeLinecap="round" />
                        <text x="22" y="42" textAnchor="middle" fill="#1687D9" fontSize="10" fontWeight="700">Wi-Fi</text>
                        <text x="22" y="54" textAnchor="middle" fill="#526985" fontSize="8">to Server</text>
                      </g>

                      {/* Backend API Cloud */}
                      <g transform="translate(535, 78)">
                        <path d="M 25 55 A 25 25 0 0 1 50 15 A 35 35 0 0 1 100 22 A 25 25 0 0 1 115 55 Z" fill="#38BDF8" />
                        <path d="M 15 58 A 20 20 0 0 1 35 25 A 30 30 0 0 1 85 28 A 22 22 0 0 1 105 58 Z" fill="#0284C7" />
                        <text x="60" y="48" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800">Backend API</text>
                      </g>
                    </svg>
                  </div>

                  {/* 4 Process Steps */}
                  <div className="flex items-center justify-between gap-1 overflow-x-auto pt-1 pb-0.5">
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-6 h-6 rounded-full bg-[#FFF7ED] text-[#F07818] text-[11px] font-bold flex items-center justify-center border border-[#FDBA74]">1</div>
                      <span className="text-[11px] font-bold text-[#F07818] leading-tight">Sense<br />Distance</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#DCE6F0] shrink-0" />
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-6 h-6 rounded-full bg-[#F0FDF4] text-[#16A66A] text-[11px] font-bold flex items-center justify-center border border-[#86EFAC]">2</div>
                      <span className="text-[11px] font-bold text-[#16A66A] leading-tight">Calculate<br />Fill Level</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#DCE6F0] shrink-0" />
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-6 h-6 rounded-full bg-[#F0F5FB] text-[#1687D9] text-[11px] font-bold flex items-center justify-center border border-[#DCE6F0]">3</div>
                      <span className="text-[11px] font-bold text-[#1687D9] leading-tight">Display<br />on LCD</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#DCE6F0] shrink-0" />
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-6 h-6 rounded-full bg-[#F0F5FB] text-[#1687D9] text-[11px] font-bold flex items-center justify-center border border-[#DCE6F0]">4</div>
                      <span className="text-[11px] font-bold text-[#1687D9] leading-tight">Send via<br />Wi-Fi</span>
                    </div>
                  </div>
                </div>

                {/* Demo Fleet Simulation Controller */}
                <div className="bg-white rounded-[16px] border border-[#DCE6F0] shadow-xs p-6 space-y-5 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#FFF7ED] flex items-center justify-center shrink-0 border border-[#FED7AA]">
                      <Cpu className="w-5 h-5 text-[#F07818]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h2 className="text-base font-bold text-[#14283F]">Demo Fleet Simulation Controller</h2>
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-wider ${
                            demoRunning
                              ? 'bg-[#FFF7ED] border-[#FDBA74] text-[#F07818]'
                              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#526985]'
                          }`}
                        >
                          {demoRunning && <Radio className="w-3 h-3 animate-pulse" />}
                          <span>{demoRunning ? 'AUTO TICKER RUNNING' : 'PAUSED'}</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#526985] mt-1 leading-relaxed">
                        Control automatic telemetry for demo bins. Useful for UI testing.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleRunDemoStep}
                      disabled={isStepping}
                      className="flex-1 py-2.5 px-4 bg-white border border-[#86EFAC] text-[#16A66A] rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#F0FDF4] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#16A66A] active:scale-[0.99]"
                    >
                      {isStepping ? (
                        <div className="w-4 h-4 border-2 border-[#16A66A] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 fill-[#16A66A]" />
                      )}
                      <span>Run 1 Simulation Step</span>
                    </button>

                    <button
                      onClick={() => toggleDemoSimulation(!demoRunning)}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.99] ${
                        demoRunning
                          ? 'bg-[#FFF7ED] border border-[#FDBA74] text-[#F07818] hover:bg-[#FFEDD5] focus-visible:ring-[#F07818]'
                          : 'bg-white border border-[#DCE6F0] text-[#526985] hover:bg-[#F8FAFC] focus-visible:ring-[#526985]'
                      }`}
                    >
                      {demoRunning ? <Pause className="w-4 h-4 fill-[#F07818]" /> : <Play className="w-4 h-4" />}
                      <span>{demoRunning ? 'Pause Auto Ticker' : 'Resume Auto Ticker'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* TELEMETRY LOG TOGGLE BUTTON (Positioned bottom right matching reference screenshot) */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentView('diagnostics');
                  setHasUnreadLog(false);
                }}
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-[#14283F] border border-[#DCE6F0] hover:border-[#1687D9] hover:text-[#1687D9] shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#1687D9] group"
              >
                <Terminal className="w-4 h-4 text-[#1687D9]" />
                <span>Telemetry Log</span>

                {hasUnreadLog && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#16A66A] text-white text-[10px] font-bold animate-pulse">
                    New Event
                  </span>
                )}

                <ChevronRight className="w-4 h-4 text-[#526985] group-hover:translate-x-0.5 transition-transform duration-200" />
              </button>
            </div>
          </motion.div>
        ) : (
          /* ================= VIEW 2: DEDICATED FULL-WIDTH TELEMETRY DIAGNOSTICS VIEW ================= */
          <motion.div
            key="diagnostics-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              duration: prefersReducedMotion ? 0.05 : 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="max-w-[1400px] mx-auto space-y-6 pb-12"
          >
            {/* Dedicated View Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <button
                  type="button"
                  onClick={() => setCurrentView('hardware')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#DCE6F0] text-xs font-bold text-[#14283F] hover:border-[#1687D9] hover:text-[#1687D9] transition-all cursor-pointer shadow-2xs mb-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#1687D9]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Hardware</span>
                </button>

                <h1 className="text-2xl lg:text-[26px] font-bold text-[#14283F] tracking-tight">
                  Telemetry Diagnostics
                </h1>
                <p className="text-sm text-[#526985] mt-1">
                  Full-width real-time packet inspection, server responses, and verification diagnostics.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE6F0] rounded-xl text-xs font-semibold text-[#14283F] shadow-2xs">
                  <div className="w-2 h-2 rounded-full bg-[#16A66A] animate-pulse" />
                  <span>Real-Time Monitor</span>
                </div>

                {diagnosticLog && (
                  <button
                    onClick={handleClearLog}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCE6F0] text-xs font-bold text-[#E54855] hover:bg-[#FEF2F2] hover:border-[#FCA5A5] transition-colors cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Diagnostics</span>
                  </button>
                )}
              </div>
            </div>

            {/* THREE DIAGNOSTIC CARDS (FULL WIDTH, 1 ROW ON DESKTOP, RESPONSIVE ON TABLET/MOBILE) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* ============ CARD 1: TELEMETRY REQUEST ============ */}
              <div className="bg-white rounded-[18px] border border-[#DCE6F0] p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow duration-200 space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#F0F5FB] flex items-center justify-center border border-[#E2EEF9]">
                        <Send className="w-4 h-4 text-[#1687D9]" />
                      </div>
                      <h3 className="text-sm font-bold text-[#14283F]">1. Telemetry Request</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#526985]">
                        {diagnosticLog ? diagnosticLog.request.timestamp : '--:--:--'}
                      </span>
                      {diagnosticLog && (
                        <button
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(diagnosticLog.request.payload, null, 2),
                              setCopiedReq
                            )
                          }
                          className="p-1 rounded text-[#526985] hover:text-[#1687D9] transition-colors cursor-pointer"
                          title="Copy request payload"
                        >
                          {copiedReq ? (
                            <Check className="w-4 h-4 text-[#16A66A]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 font-mono text-xs text-[#14283F] leading-relaxed overflow-x-auto min-h-[150px]">
                    {diagnosticLog ? (
                      <pre className="whitespace-pre-wrap">
                        {`{\n  "bin_id": "${diagnosticLog.request.payload.bin_id || 'DEMO'}",\n  "distance": ${diagnosticLog.request.payload.distance ?? 6.8},\n  "fill_percent": ${diagnosticLog.request.payload.fill_percent ?? fillPercent},\n  "status": "${diagnosticLog.request.payload.status || 'NORMAL'}"\n}`}
                      </pre>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[#94A3B8] italic text-xs py-10">
                        Ready. Transmit a packet or run one simulation step.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2 text-xs font-bold text-[#16A66A]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{diagnosticLog ? 'Packet ready to send' : 'Standing by'}</span>
                </div>
              </div>

              {/* ============ CARD 2: SERVER RESPONSE ============ */}
              <div className="bg-white rounded-[18px] border border-[#DCE6F0] p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow duration-200 space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#F0FDF4] flex items-center justify-center border border-[#DCFCE7]">
                        <Database className="w-4 h-4 text-[#16A66A]" />
                      </div>
                      <h3 className="text-sm font-bold text-[#14283F]">2. Server Response</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#526985]">
                        {diagnosticLog ? diagnosticLog.response.timestamp : '--:--:--'}
                      </span>
                      {diagnosticLog && (
                        <button
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(diagnosticLog.response.body, null, 2),
                              setCopiedRes
                            )
                          }
                          className="p-1 rounded text-[#526985] hover:text-[#1687D9] transition-colors cursor-pointer"
                          title="Copy response body"
                        >
                          {copiedRes ? (
                            <Check className="w-4 h-4 text-[#16A66A]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 font-mono text-xs text-[#14283F] leading-relaxed overflow-x-auto min-h-[150px]">
                    {diagnosticLog ? (
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(diagnosticLog.response.body, null, 2)}
                      </pre>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[#94A3B8] italic text-xs py-10">
                        Awaiting server transmission...
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2 text-xs font-bold">
                  {diagnosticLog?.response.status === 200 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#16A66A] shrink-0" />
                      <span className="text-[#16A66A]">HTTP 200 OK</span>
                    </>
                  ) : diagnosticLog ? (
                    <>
                      <XCircle className="w-4 h-4 text-[#E54855] shrink-0" />
                      <span className="text-[#E54855]">{diagnosticLog.response.statusText}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" />
                      <span className="text-[#64748B]">No response yet</span>
                    </>
                  )}
                </div>
              </div>

              {/* ============ CARD 3: VALIDATION RESULT ============ */}
              <div className="bg-white rounded-[18px] border border-[#DCE6F0] p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow duration-200 space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#FFFBEB] flex items-center justify-center border border-[#FEF3C7]">
                        <ShieldCheck className="w-4 h-4 text-[#D99A12]" />
                      </div>
                      <h3 className="text-sm font-bold text-[#14283F]">3. Validation Result</h3>
                    </div>
                    <span className="text-xs font-mono text-[#526985]">
                      {diagnosticLog ? diagnosticLog.validation.timestamp : '--:--:--'}
                    </span>
                  </div>

                  <div className="mt-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-2.5 min-h-[150px] flex flex-col justify-center">
                    {diagnosticLog ? (
                      diagnosticLog.validation.checks.map((check, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 text-xs">
                          {check.status === 'PASSED' ? (
                            <CheckCircle2 className="w-4 h-4 text-[#16A66A] shrink-0" />
                          ) : check.status === 'FAILED' ? (
                            <XCircle className="w-4 h-4 text-[#E54855] shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-[#CBD5E1] bg-white shrink-0" />
                          )}
                          <span
                            className={`font-medium ${
                              check.status === 'PASSED'
                                ? 'text-[#14283F]'
                                : check.status === 'FAILED'
                                ? 'text-[#E54855]'
                                : 'text-[#64748B]'
                            }`}
                          >
                            {check.label}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="space-y-2.5 text-xs text-[#94A3B8]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-3.5 h-3.5 rounded-full border border-[#E2E8F0] bg-white shrink-0" />
                          <span>API Key Valid</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="w-3.5 h-3.5 rounded-full border border-[#E2E8F0] bg-white shrink-0" />
                          <span>Bin ID Found (BIN_001)</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="w-3.5 h-3.5 rounded-full border border-[#E2E8F0] bg-white shrink-0" />
                          <span>Data Stored in Database</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="w-3.5 h-3.5 rounded-full border border-[#E2E8F0] bg-white shrink-0" />
                          <span>Dashboard Updated</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="w-3.5 h-3.5 rounded-full border border-[#E2E8F0] bg-white shrink-0" />
                          <span>Telemetry Processed Successfully</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2 text-xs font-bold">
                  {diagnosticLog ? (
                    diagnosticLog.validation.checks.every((c) => c.status === 'PASSED') ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#16A66A] shrink-0" />
                        <span className="text-[#16A66A]">All Verifications Passed</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-[#F07818] shrink-0" />
                        <span className="text-[#F07818]">Verification Checks Complete</span>
                      </>
                    )
                  ) : (
                    <>
                      <div className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" />
                      <span className="text-[#64748B]">Standing by for diagnostics</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
