import React from 'react';
import { Bin, TelemetryRecord } from '../../types';
import {
  X,
  MapPin,
  Clock,
  Cpu,
  Activity,
  ArrowDownUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { drawerVariants } from '../../utils/motion';

interface BinDetailDrawerProps {
  bin: Bin | null;
  history: TelemetryRecord[];
  onClose: () => void;
  onSimulateCollect?: (binId: string) => void;
}

export const BinDetailDrawer: React.FC<BinDetailDrawerProps> = ({
  bin,
  history,
  onClose,
  onSimulateCollect,
}) => {
  if (!bin) return null;

  // Prepare chart series
  const chartData = history.map((record) => {
    const time = new Date(record.recorded_at);
    return {
      time: `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`,
      fill: record.fill_percent,
      distance: record.distance_cm,
    };
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1500] flex justify-end">
        {/* Backdrop Fade: 200ms with subtle blur (Section 12) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-xs"
        />

        {/* Drawer Sliding Panel */}
        <motion.div
          variants={drawerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full sm:w-[480px] bg-white border-l border-[#DCE6F0] shadow-2xl flex flex-col h-full overflow-hidden z-10"
        >
          {/* Drawer Header */}
          <div className="p-4.5 border-b border-[#DCE6F0] bg-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#1687D9] flex items-center justify-center text-white shadow-xs">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-[#14283F]">{bin.bin_id}</h3>
                  {bin.data_source === 'REAL' ? (
                    <span className="text-[10px] bg-[#E8F4FF] text-[#1687D9] px-2 py-0.5 rounded-full font-bold border border-[#C8D7E6]">
                      REAL HARDWARE
                    </span>
                  ) : (
                    <span className="text-[10px] bg-[#F7FAFD] text-[#526985] px-2 py-0.5 rounded-full font-medium border border-[#DCE6F0]">
                      DEMO FLEET
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#526985] truncate max-w-[280px]">{bin.name}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8192A8] hover:text-[#14283F] hover:bg-[#F0F5FB] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Real-time KPI Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-[#DCE6F0] bg-[#F7FAFD]">
                <span className="text-[10px] text-[#8192A8] font-bold block uppercase tracking-wider">Current Fill</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold font-mono text-[#14283F]">{bin.current_fill_percent}%</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    bin.current_status === 'FULL' ? 'bg-[#FFE9EB] text-[#E54855] border border-[#FCA5A5]' :
                    bin.current_status === 'HIGH' ? 'bg-[#FFF7ED] text-[#EA580C] border border-[#FDBA74]' :
                    bin.current_status === 'MEDIUM' ? 'bg-[#FFF5D9] text-[#D99A12] border border-[#FCD34D]' :
                    'bg-[#E4F8EE] text-[#16A66A] border border-[#86EFAC]'
                  }`}>
                    {bin.current_status}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#DCE6F0] bg-[#F7FAFD]">
                <span className="text-[10px] text-[#8192A8] font-bold block uppercase tracking-wider">Depth to Waste</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold font-mono text-[#14283F]">{bin.current_distance_cm}</span>
                  <span className="text-xs text-[#8192A8] font-semibold">cm</span>
                </div>
              </div>
            </div>

            {/* Location & GIS Details */}
            <div className="p-4.5 rounded-xl border border-[#DCE6F0] bg-white space-y-3 text-xs shadow-card">
              <div className="font-bold text-[#14283F] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#1687D9]" />
                Location &amp; Administrative Data
              </div>

              <div className="grid grid-cols-2 gap-y-2.5 text-[#334155]">
                <div>
                  <span className="text-[#64748B] block text-[11px]">Location:</span>
                  <span className="font-semibold text-[#0F172A]">{bin.location}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px]">Ward &amp; Zone:</span>
                  <span className="font-semibold text-[#0F172A]">{bin.ward} ({bin.zone})</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px]">Coordinates:</span>
                  <span className="font-mono text-[#0F172A]">{bin.latitude.toFixed(4)}, {bin.longitude.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px]">Connection:</span>
                  <span className={`font-bold ${
                    bin.connection_state === 'ONLINE' ? 'text-[#16A34A]' :
                    bin.connection_state === 'WARNING' ? 'text-[#EA580C]' : 'text-[#64748B]'
                  }`}>
                    {bin.connection_state || 'ONLINE'}
                  </span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#F1F5F9] flex items-center gap-1.5 text-[#64748B] text-[11px]">
                <Clock className="w-3 h-3" />
                <span>Last heartbeat: {new Date(bin.last_seen).toLocaleString()}</span>
              </div>
            </div>

            {/* Chart 1: Fill Percentage Over Time */}
            <div className="p-4.5 rounded-xl border border-[#DCE6F0] bg-white shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#14283F]">
                  <Activity className="w-3.5 h-3.5 text-[#1687D9]" />
                  <span>Fill Percentage Over Time</span>
                </div>
                <span className="text-[10px] text-[#8192A8] font-mono">Recent Telemetry</span>
              </div>

              <div className="h-44 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="time" stroke="#8192A8" fontSize={10} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="#8192A8" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#DCE6F0',
                          borderRadius: '8px',
                          fontSize: '11px',
                          boxShadow: '0 4px 12px rgba(24, 48, 78, 0.08)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="fill"
                        name="Fill %"
                        stroke="#1687D9"
                        strokeWidth={2.5}
                        dot={{ r: 2, fill: '#1687D9' }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#8192A8]">
                    Awaiting telemetry points...
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Ultrasonic Distance Over Time */}
            <div className="p-4.5 rounded-xl border border-[#DCE6F0] bg-white shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#14283F]">
                  <ArrowDownUp className="w-3.5 h-3.5 text-[#16A66A]" />
                  <span>Distance (cm) Over Time</span>
                </div>
                <span className="text-[10px] text-[#8192A8] font-mono">HC-SR04 Raw Depth</span>
              </div>

              <div className="h-40 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="time" stroke="#8192A8" fontSize={10} tickLine={false} />
                      <YAxis domain={[0, 35]} stroke="#8192A8" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#DCE6F0',
                          borderRadius: '8px',
                          fontSize: '11px',
                          boxShadow: '0 4px 12px rgba(24, 48, 78, 0.08)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="distance"
                        name="Distance (cm)"
                        stroke="#16A66A"
                        strokeWidth={2}
                        dot={{ r: 2, fill: '#16A66A' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#8192A8]">
                    Awaiting telemetry points...
                  </div>
                )}
              </div>
            </div>

            {/* Action Controls */}
            <div className="pt-2">
              {bin.data_source === 'DEMO' && onSimulateCollect && (
                <button
                  onClick={() => onSimulateCollect(bin.bin_id)}
                  className="btn-primary w-full !h-[42px] text-xs font-bold cursor-pointer"
                >
                  Simulate Municipal Collection
                </button>
              )}

              {bin.data_source === 'REAL' && (
                <div className="p-3.5 bg-[#E8F4FF] border border-[#C8D7E6] rounded-xl text-xs text-[#14283F]">
                  <span className="font-bold block mb-0.5 text-[#1687D9]">🔒 Physical Hardware Locked:</span>
                  This record is bound to real physical hardware ({bin.bin_id}). Fill percentage only resets when physical garbage is cleared from the physical container and measured by the HC-SR04 sensor.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
