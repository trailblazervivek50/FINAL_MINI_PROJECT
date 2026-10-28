import React from 'react';
import { motion } from 'framer-motion';
import { useMunicipal } from '../context/MunicipalContext';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { BarChart3, TrendingUp, Layers, Cpu } from 'lucide-react';
import {
  createStaggerContainer,
  cardEntranceVariants,
  cardHoverTap,
} from '../utils/motion';

const analyticsStagger = createStaggerContainer(0.06, 0.02);

export const AnalyticsPage: React.FC = () => {
  const { analytics, realBins, demoBins } = useMunicipal();

  // Status Distribution Data using Semantic Status Palette
  const statusData = [
    { name: 'Full (>=90%)', count: analytics?.statusCounts.full || 0, color: '#DC2626' },
    { name: 'High (80-89%)', count: analytics?.statusCounts.high || 0, color: '#EA580C' },
    { name: 'Medium (50-79%)', count: analytics?.statusCounts.medium || 0, color: '#D97706' },
    { name: 'Low (0-49%)', count: analytics?.statusCounts.low || 0, color: '#16A34A' },
  ];

  // Ward Accumulation Data
  const wardData = (analytics?.wardStats || []).map((w) => ({
    name: w.ward.replace('Ward ', 'W-'),
    avgFill: w.averageFill,
    total: w.total,
    critical: w.criticalCount,
  }));

  // Hourly Trends Data (Primary Purple #7C5CDB - Section 11 & 35)
  const hourlyData = analytics?.hourlyTrends || [];

  return (
    <motion.div
      variants={analyticsStagger}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={cardEntranceVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs"
      >
        <div>
          <h1 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0284C7]" />
            <span>Municipal Analytics &amp; Trends</span>
          </h1>
          <p className="text-xs text-[#334155] mt-0.5">
            Operational intelligence, fill distributions, and 24-hour waste accumulation trends.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] text-xs font-semibold text-[#0284C7]">
            Municipal Average: {analytics?.averageFill ?? 52}% Fill
          </div>
        </div>
      </motion.div>

      {/* Top Comparison KPIs: Real vs Demo Fleet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Real Hardware Card */}
        <motion.div
          variants={cardEntranceVariants}
          {...cardHoverTap}
          className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs card-hover"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#E0F2FE] text-[#0284C7]">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0F172A]">Real Hardware Receptacles</h3>
                <span className="text-[11px] text-[#64748B]">Physical Arduino UNO + ESP8266 + HC-SR04</span>
              </div>
            </div>
            <span className="text-xs font-bold font-mono text-[#0284C7] bg-[#E0F2FE] border border-[#BAE6FD] px-2 py-0.5 rounded">
              5 Devices
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#F1F5F9] text-xs">
            <div>
              <span className="text-[#64748B] block text-[11px]">Avg Distance:</span>
              <span className="font-mono font-bold text-[#0F172A]">
                {(realBins.reduce((acc, b) => acc + b.current_distance_cm, 0) / (realBins.length || 1)).toFixed(1)} cm
              </span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Avg Fill:</span>
              <span className="font-mono font-bold text-[#0F172A]">
                {Math.round(realBins.reduce((acc, b) => acc + b.current_fill_percent, 0) / (realBins.length || 1))}%
              </span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Online Status:</span>
              <span className="font-semibold text-[#16A34A]">
                {realBins.filter((b) => b.online).length}/5 Active
              </span>
            </div>
          </div>
        </motion.div>

        {/* Demo Fleet Card */}
        <motion.div
          variants={cardEntranceVariants}
          {...cardHoverTap}
          className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs card-hover"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#F8FAFC] text-[#334155]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0F172A]">Municipal Demo Fleet</h3>
                <span className="text-[11px] text-[#64748B]">Civic-scale simulation grid across 10 wards</span>
              </div>
            </div>
            <span className="text-xs font-bold font-mono text-[#334155] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded">
              {demoBins.length} Devices
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#F1F5F9] text-xs">
            <div>
              <span className="text-[#64748B] block text-[11px]">Critical (&gt;80%):</span>
              <span className="font-mono font-bold text-[#DC2626]">
                {demoBins.filter((b) => b.current_fill_percent >= 80).length} Bins
              </span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Avg Fill:</span>
              <span className="font-mono font-bold text-[#0F172A]">
                {Math.round(demoBins.reduce((acc, b) => acc + b.current_fill_percent, 0) / (demoBins.length || 1))}%
              </span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Fleet Health:</span>
              <span className="font-semibold text-[#16A34A]">
                {Math.round((demoBins.filter((b) => b.online).length / (demoBins.length || 1)) * 100)}% Online
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Primary Trend Chart (Enterprise Blue System) */}
      <motion.div
        variants={cardEntranceVariants}
        className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0284C7]" />
              <span>24-Hour Municipal Waste Accumulation Trend</span>
            </h3>
            <p className="text-xs text-[#334155] mt-0.5">Average municipal fill levels plotted across hourly windows.</p>
          </div>
          <span className="text-xs font-mono text-[#64748B]">Past 24 Hours</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="hour" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  fontSize: '12px',
                  color: '#0F172A',
                }}
              />
              <Line
                type="monotone"
                dataKey="averageFill"
                name="Average Fill %"
                stroke="#0284C7"
                strokeWidth={2.8}
                dot={{ r: 3, fill: '#0284C7' }}
                activeDot={{ r: 6 }}
                animationDuration={600}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fill Status Breakdown */}
        <motion.div
          variants={cardEntranceVariants}
          className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs"
        >
          <h3 className="font-bold text-sm text-[#0F172A] mb-1">Status Distribution</h3>
          <p className="text-xs text-[#334155] mb-4">Total receptacles categorized by current operating capacity.</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    fontSize: '12px',
                    color: '#0F172A',
                  }}
                />
                <Bar dataKey="count" name="Receptacles" radius={[6, 6, 0, 0]} animationDuration={600}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Ward Accumulation Comparison with Purple #6F4FC8 */}
        <motion.div
          variants={cardEntranceVariants}
          className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs"
        >
          <h3 className="font-bold text-sm text-[#0F172A] mb-1">Ward-Level Waste Pressure</h3>
          <p className="text-xs text-[#334155] mb-4">Comparison of average fill percentages across municipal administrative wards.</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    fontSize: '12px',
                    color: '#0F172A',
                  }}
                />
                <Bar dataKey="avgFill" name="Avg Fill %" fill="#6F4FC8" radius={[6, 6, 0, 0]} animationDuration={600} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
