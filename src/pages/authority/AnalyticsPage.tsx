import React from 'react';
import { useWasteSystem } from '../../context/WasteSystemContext';
import { BarChart3, TrendingUp, Clock, Users, ArrowUpRight } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { wards, workers, dustbins, tasks, reports } = useWasteSystem();

  const collectionTrendData = [
    { hour: '06:00', tons: 4.2, reports: 2 },
    { hour: '08:00', tons: 8.5, reports: 6 },
    { hour: '10:00', tons: 14.1, reports: 11 },
    { hour: '12:00', tons: 21.8, reports: 19 },
    { hour: '14:00', tons: 16.4, reports: 8 },
    { hour: '16:00', tons: 19.2, reports: 12 },
    { hour: '18:00', tons: 11.0, reports: 5 },
  ];

  const wardPerformance = [
    { ward: 'Ward 05', area: 'Market Area', efficiency: 92 },
    { ward: 'Ward 02', area: 'Heritage Quarter', efficiency: 84 },
    { ward: 'Ward 07', area: 'Medical District', efficiency: 76 },
    { ward: 'Ward 03', area: 'Railway Junction', efficiency: 71 },
    { ward: 'Ward 01', area: 'Civic Enclave', efficiency: 96 },
    { ward: 'Ward 08', area: 'Industrial Corridor', efficiency: 68 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Editorial Header */}
      <div className="pb-6 border-b border-[rgba(26,26,24,0.15)] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-[#6E6B64] flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-[#2F4B7C]" />
            <span>MUNICIPAL OPERATIONS INTELLIGENCE</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A18] mt-1">
            System Operations Analytics
          </h1>
          <p className="text-sm text-[#6E6B64] mt-1 font-sans">
            Longitudinal waste generation trends, ward efficiency benchmarks, and SLA response analytics.
          </p>
        </div>

        <div className="font-mono text-xs text-[#6E6B64]">
          AUDIT CYCLE: <span className="font-bold text-[#1A1A18]">OCTOBER 2026 SHIFT</span>
        </div>
      </div>

      {/* Primary Trend Chart: Restrained & Typography-Led (Requirement 29) */}
      <div className="bg-[#F3F1EC] rounded-2xl border border-[rgba(26,26,24,0.15)] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-4 border-b border-[rgba(26,26,24,0.12)] gap-2">
          <div>
            <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#6E6B64]">
              HOURLY MASS OFFLOAD
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#1A1A18]">
              Waste Collection Volume Trend
            </h2>
          </div>
          <div className="font-mono text-xs text-[#2F4B7C] font-semibold">
            TOTAL TODAY: 95.2 METRIC TONS
          </div>
        </div>

        <div className="h-72 w-full pt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={collectionTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTons" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2F4B7C" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2F4B7C" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,24,0.08)" />
              <XAxis
                dataKey="hour"
                stroke="#6E6B64"
                tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              />
              <YAxis
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
              <Area
                type="monotone"
                dataKey="tons"
                name="Tons Cleared"
                stroke="#2F4B7C"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorTons)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Area Performance & Response Time (Exact Requirement 29 Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Area Performance */}
        <div className="md:col-span-2 bg-[#E9E6DF] rounded-2xl border border-[rgba(26,26,24,0.15)] p-6 sm:p-7 shadow-xs">
          <div className="pb-3 border-b border-[rgba(26,26,24,0.12)]">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#6E6B64]">
              EFFICIENCY BENCHMARK
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1A1A18] mt-0.5">
              Area Collection Performance
            </h3>
          </div>

          <div className="divide-y divide-[rgba(26,26,24,0.08)] pt-2 font-mono text-xs">
            {wardPerformance.map((wp) => (
              <div key={wp.ward} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#1A1A18] text-sm">{wp.ward}</span>
                  <span className="text-[#6E6B64] ml-2 text-xs font-sans">{wp.area}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-[#F3F1EC] rounded-full overflow-hidden hidden sm:block">
                    <div
                      className="h-full bg-[#2F4B7C] rounded-full"
                      style={{ width: `${wp.efficiency}%` }}
                    />
                  </div>
                  <span className="font-bold text-sm text-[#1A1A18] w-10 text-right">
                    {wp.efficiency}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Response Time Breakdown (Requirement 29) */}
        <div className="bg-[#E9E6DF] rounded-2xl border border-[rgba(26,26,24,0.15)] p-6 sm:p-7 flex flex-col justify-between shadow-xs">
          <div>
            <div className="pb-3 border-b border-[rgba(26,26,24,0.12)]">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#6E6B64]">
                SLA METRICS
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1A1A18] mt-0.5">
                Response Time
              </h3>
            </div>

            <div className="pt-4 space-y-4 font-mono">
              <div className="p-3 bg-[#F3F1EC] rounded-xl border border-[rgba(26,26,24,0.08)]">
                <span className="text-xs text-[#6E6B64] uppercase block">AVERAGE RESPONSE</span>
                <span className="font-serif text-3xl font-bold text-[#1A1A18] mt-1 block">
                  24 min
                </span>
                <span className="text-[10px] text-[#5D7A62] font-semibold">
                  Within 30m SLA threshold
                </span>
              </div>

              <div className="p-3 bg-[#F3F1EC] rounded-xl border border-[rgba(26,26,24,0.08)]">
                <span className="text-xs text-[#6E6B64] uppercase block">BEST SECTOR TIME</span>
                <span className="font-serif text-3xl font-bold text-[#5D7A62] mt-1 block">
                  11 min
                </span>
                <span className="text-[10px] text-[#6E6B64]">
                  Ward 01 (University Enclave)
                </span>
              </div>

              <div className="p-3 bg-[#F3F1EC] rounded-xl border border-[rgba(26,26,24,0.08)]">
                <span className="text-xs text-[#6E6B64] uppercase block">SLOWEST SECTOR TIME</span>
                <span className="font-serif text-3xl font-bold text-[#A63D40] mt-1 block">
                  48 min
                </span>
                <span className="text-[10px] text-[#6E6B64]">
                  Ward 08 (Industrial Corridor)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
