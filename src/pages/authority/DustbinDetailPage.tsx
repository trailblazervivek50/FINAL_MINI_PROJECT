import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWasteSystem } from '../../context/WasteSystemContext';
import { STATUS_COLORS } from '../../config/thresholds';
import {
  ArrowLeft,
  Wifi,
  Cpu,
  Layers,
  AlertCircle,
  Clock,
  Radio,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const DustbinDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dustbins, reports, tasks, pushTelemetry, triggerDemoStepSequence } = useWasteSystem();

  const dustbin = dustbins.find((d) => d.id === id) || dustbins[0];
  const statusColors = STATUS_COLORS[dustbin.status];

  const binReports = reports.filter((r) => r.dustbinId === dustbin.id);
  const binTasks = tasks.filter((t) => t.dustbinId === dustbin.id);

  const chartData = dustbin.history.map((h: any) => ({
    time: h.timestamp,
    fill: h.fillPercentage,
    moisture: h.moisture,
    distance: h.distance,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-mono text-[#6E6B64] hover:text-[#1A1A18] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO MONITORING</span>
        </button>
      </div>

      {/* Main Detail Header (Requirement 19 format) */}
      <div className="bg-[#E9E6DF] rounded-2xl border border-[rgba(26,26,24,0.15)] p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-[rgba(26,26,24,0.15)]">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A18]">
                DUSTBIN {dustbin.id}
              </h1>
              {dustbin.isPhysicalHardware && (
                <span className="flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-md bg-[#2F4B7C] text-[#F3F1EC] font-semibold">
                  <Cpu className="w-3.5 h-3.5" />
                  PRIMARY HARDWARE PROTOTYPE
                </span>
              )}
            </div>
            <div className="font-mono text-sm uppercase tracking-wider text-[#6E6B64] mt-1">
              {dustbin.area} &bull; {dustbin.ward}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-mono text-xs text-[#6E6B64]">STATUS</div>
              <span
                className={`font-mono text-sm font-bold px-3 py-1 rounded inline-block mt-0.5 ${statusColors.text} ${statusColors.bg} border ${statusColors.border}`}
              >
                {dustbin.status}
              </span>
            </div>

            {dustbin.isPhysicalHardware && (
              <button
                type="button"
                onClick={() => triggerDemoStepSequence()}
                className="px-3.5 py-2 rounded-lg bg-[#1A1A18] hover:bg-[#2F4B7C] text-[#F3F1EC] font-mono text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Simulate 72% → 91%
              </button>
            )}
          </div>
        </div>

        {/* 4 Primary Telemetry Callouts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
          <div>
            <div className="font-mono text-xs text-[#6E6B64] uppercase">CAPACITY FILL</div>
            <div className="font-serif text-4xl sm:text-5xl font-bold text-[#1A1A18] mt-1">
              {dustbin.fillPercentage}%
            </div>
            <div className="text-xs text-[#6E6B64] font-medium mt-1">
              {dustbin.fillPercentage >= 85 ? 'Overfilling risk' : 'Normal capacity'}
            </div>
          </div>

          <div>
            <div className="font-mono text-xs text-[#6E6B64] uppercase">ULTRASONIC DISTANCE</div>
            <div className="font-mono text-3xl sm:text-4xl font-semibold text-[#1A1A18] mt-1.5">
              {dustbin.distance.toFixed(1)} <span className="text-lg">cm</span>
            </div>
            <div className="text-xs text-[#6E6B64] font-medium mt-1">
              Bin depth: {dustbin.height} cm
            </div>
          </div>

          <div>
            <div className="font-mono text-xs text-[#6E6B64] uppercase">MOISTURE SENSOR</div>
            <div className="font-mono text-3xl sm:text-4xl font-semibold text-[#1A1A18] mt-1.5">
              {dustbin.moisture}%
            </div>
            <div className="text-xs text-[#6E6B64] font-medium mt-1">
              {dustbin.moisture > 60 ? 'High wet waste' : 'Dry solid waste'}
            </div>
          </div>

          <div>
            <div className="font-mono text-xs text-[#6E6B64] uppercase">ESP8266 CONNECTION</div>
            <div className="flex items-center gap-2 mt-2">
              <Wifi
                className={`w-5 h-5 ${
                  dustbin.espConnection === 'CONNECTED' ? 'text-[#5D7A62]' : 'text-[#A63D40]'
                }`}
              />
              <span className="font-mono text-sm font-bold text-[#1A1A18]">
                {dustbin.espConnection}
              </span>
            </div>
            <div className="font-mono text-xs text-[#6E6B64] mt-1">
              UPDATED {dustbin.lastUpdated}
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Chart: Fill History */}
      <div className="bg-[#F3F1EC] rounded-2xl border border-[rgba(26,26,24,0.15)] p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[rgba(26,26,24,0.12)] gap-2">
          <div>
            <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#6E6B64]">
              HISTORICAL TELEMETRY LOG
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#1A1A18]">
              Fill Level & Moisture Dynamics
            </h2>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="flex items-center gap-1.5 text-[#2F4B7C] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2F4B7C]" /> Fill %
            </span>
            <span className="flex items-center gap-1.5 text-[#B8892D] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B8892D]" /> Moisture %
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,24,0.08)" />
              <XAxis
                dataKey="time"
                stroke="#6E6B64"
                tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#6E6B64"
                tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1A18',
                  color: '#F3F1EC',
                  borderRadius: '8px',
                  fontFamily: 'IBM Plex Mono',
                  fontSize: '12px',
                  border: 'none',
                }}
              />
              <Line
                type="monotone"
                dataKey="fill"
                name="Fill %"
                stroke="#2F4B7C"
                strokeWidth={3}
                dot={{ r: 4, fill: '#2F4B7C' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="moisture"
                name="Moisture %"
                stroke="#B8892D"
                strokeWidth={2}
                dot={{ r: 3, fill: '#B8892D' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Linked Citizen Reports & Operational Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reports for this bin */}
        <div className="bg-[#F3F1EC] rounded-2xl border border-[rgba(26,26,24,0.15)] p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(26,26,24,0.12)]">
            <h3 className="font-serif text-lg font-bold text-[#1A1A18] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#A63D40]" />
              Citizen Reports ({binReports.length})
            </h3>
            <Link
              to="/authority/reports"
              className="text-xs font-mono text-[#2F4B7C] hover:underline"
            >
              All Reports &rarr;
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {binReports.length === 0 ? (
              <p className="text-xs text-[#6E6B64] italic">No active citizen reports logged for this bin.</p>
            ) : (
              binReports.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-lg border border-[rgba(26,26,24,0.1)] bg-[#E9E6DF]/50 space-y-1.5"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-[#1A1A18]">{r.id}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#1A1A18] text-[#F3F1EC]">
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#1A1A18] font-medium">{r.issue}</p>
                  <p className="text-[11px] text-[#6E6B64]">{r.description}</p>
                  <div className="font-mono text-[10px] text-[#6E6B64] pt-1">Logged at {r.timestamp}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tasks for this bin */}
        <div className="bg-[#F3F1EC] rounded-2xl border border-[rgba(26,26,24,0.15)] p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(26,26,24,0.12)]">
            <h3 className="font-serif text-lg font-bold text-[#1A1A18] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2F4B7C]" />
              Workforce Tasks ({binTasks.length})
            </h3>
            <Link
              to="/authority/tasks"
              className="text-xs font-mono text-[#2F4B7C] hover:underline"
            >
              All Tasks &rarr;
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {binTasks.length === 0 ? (
              <p className="text-xs text-[#6E6B64] italic">No tasks currently assigned for this bin.</p>
            ) : (
              binTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-[rgba(26,26,24,0.1)] bg-[#E9E6DF]/50 space-y-1.5"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-[#1A1A18]">{t.id}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#2F4B7C] text-white">
                      {t.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#1A1A18]">
                    Worker: <span className="font-semibold">{t.workerName}</span>
                  </div>
                  <div className="text-[11px] text-[#6E6B64]">
                    Assigned: {t.assignedAt} &bull; Deadline: {t.deadline}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
