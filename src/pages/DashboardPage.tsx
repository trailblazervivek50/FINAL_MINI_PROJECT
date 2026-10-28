import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMunicipal } from '../context/MunicipalContext';
import {
  Trash2,
  Wifi,
  WifiOff,
  AlertTriangle,
  AlertCircle,
  Cpu,
  ArrowRight,
  MapPin,
  Radio,
} from 'lucide-react';
import { filterBinsByKpi } from '../utils/kpiFilters';
import {
  createStaggerContainer,
  cardEntranceVariants,
} from '../utils/motion';
import { BarshiDashboardHeatmap } from '../components/map/BarshiDashboardHeatmap';

const dashboardStagger = createStaggerContainer(0.06, 0.03);

interface KpiCardConfig {
  id: string;
  label: string;
  value: number;
  valueColor?: string;
  supportingText: string;
  supportingColor?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  cardBg: string;
  cardBorder: string;
  arrowBg: string;
  arrowColor: string;
  waveColor: string;
  linkTo: string;
}

export const DashboardPage: React.FC = () => {
  const { bins, realBins, demoBins, selectedBinId, setSelectedBinId } = useMunicipal();

  // Compute exact counts using single source of truth
  const totalCount = filterBinsByKpi(bins, 'all').length;
  const onlineCount = filterBinsByKpi(bins, 'online').length;
  const offlineCount = filterBinsByKpi(bins, 'offline').length;
  const fullCount = filterBinsByKpi(bins, 'full').length;
  const highCount = filterBinsByKpi(bins, 'high').length;
  const realCount = filterBinsByKpi(bins, 'real').length;

  const realSupportText =
    realBins.length > 0
      ? `${realBins[0]?.bin_id} ... ${realBins[realBins.length - 1]?.bin_id}`
      : 'BIN_001 ... BIN_005';

  const currentSelected =
    bins.find((b) => b.bin_id === selectedBinId) || realBins[0] || bins[0];

  const cards: KpiCardConfig[] = [
    // Row 1, Col 1: Total Bins
    {
      id: 'total',
      label: 'TOTAL BINS',
      value: totalCount,
      supportingText: `${realCount} Real + ${demoBins.length} Demo`,
      supportingColor: 'text-[#8C7A5E]',
      icon: Trash2,
      iconColor: 'text-[#E68A00]',
      iconBg: 'bg-[#FEF1D4]',
      cardBg: 'bg-[#FFF9EE]',
      cardBorder: 'border-[#FDE8B3]',
      arrowBg: 'bg-[#FEF1D4]',
      arrowColor: 'text-[#E68A00]',
      waveColor: '#FED7AA',
      linkTo: '/bins?filter=total',
    },
    // Row 1, Col 2: Online
    {
      id: 'online',
      label: 'ONLINE',
      value: onlineCount,
      supportingText: '< 5 min heartbeats',
      supportingColor: 'text-[#5A876E]',
      icon: Wifi,
      iconColor: 'text-[#16A66A]',
      iconBg: 'bg-[#DEF7E9]',
      cardBg: 'bg-[#F0FAF4]',
      cardBorder: 'border-[#CCEBD8]',
      arrowBg: 'bg-[#DEF7E9]',
      arrowColor: 'text-[#16A66A]',
      waveColor: '#A7F3D0',
      linkTo: '/bins?filter=online',
    },
    // Row 1, Col 3: Offline
    {
      id: 'offline',
      label: 'OFFLINE',
      value: offlineCount,
      supportingText: '> 15 min inactive',
      supportingColor: 'text-[#6C7E90]',
      icon: WifiOff,
      iconColor: 'text-[#5A7795]',
      iconBg: 'bg-[#E3EDF6]',
      cardBg: 'bg-[#F2F6FA]',
      cardBorder: 'border-[#D7E2EC]',
      arrowBg: 'bg-[#E3EDF6]',
      arrowColor: 'text-[#5A7795]',
      waveColor: '#CBD5E1',
      linkTo: '/bins?filter=offline',
    },
    // Row 2, Col 1: Full Bins (>=90%)
    {
      id: 'full',
      label: 'FULL BINS ( ≥ 90% )',
      value: fullCount,
      valueColor: 'text-[#E54855]',
      supportingText: 'Urgent pickup',
      supportingColor: 'text-[#E54855] font-semibold',
      icon: AlertTriangle,
      iconColor: 'text-[#E54855]',
      iconBg: 'bg-[#FFE0E3]',
      cardBg: 'bg-[#FFF2F2]',
      cardBorder: 'border-[#FFD6D6]',
      arrowBg: 'bg-[#FFE0E3]',
      arrowColor: 'text-[#E54855]',
      waveColor: '#FECDD3',
      linkTo: '/bins?filter=full',
    },
    // Row 2, Col 2: High Bins (80-89%)
    {
      id: 'high',
      label: 'HIGH BINS ( 80 - 89% )',
      value: highCount,
      valueColor: 'text-[#F07818]',
      supportingText: 'Elevated fill',
      supportingColor: 'text-[#A86432]',
      icon: AlertCircle,
      iconColor: 'text-[#F07818]',
      iconBg: 'bg-[#FFE8D6]',
      cardBg: 'bg-[#FFF6ED]',
      cardBorder: 'border-[#FEDDC1]',
      arrowBg: 'bg-[#FFE8D6]',
      arrowColor: 'text-[#F07818]',
      waveColor: '#FFEDD5',
      linkTo: '/bins?filter=high',
    },
    // Row 2, Col 3: Real Devices
    {
      id: 'real',
      label: 'REAL DEVICES',
      value: realCount,
      valueColor: 'text-[#1687D9]',
      supportingText: realSupportText,
      supportingColor: 'text-[#5B7898]',
      icon: Cpu,
      iconColor: 'text-[#1687D9]',
      iconBg: 'bg-[#DDECFB]',
      cardBg: 'bg-[#F0F7FD]',
      cardBorder: 'border-[#CCE2F8]',
      arrowBg: 'bg-[#DDECFB]',
      arrowColor: 'text-[#1687D9]',
      waveColor: '#BAE6FD',
      linkTo: '/bins?filter=real',
    },
  ];

  return (
    <motion.div
      variants={dashboardStagger}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-7xl mx-auto py-2"
    >
      {/* Dashboard Heading & Location Selector (Section 1 Specification) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#14283F] tracking-tight">
            Municipal Waste Monitoring
          </h1>
          <p className="text-sm text-[#526985] mt-1.5 font-medium">
            Live heatmap of bin fill-up levels across Barshi, Solapur.
          </p>
        </div>

        {/* Compact Location Selector Pill */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto px-3.5 py-2 bg-white border border-[#DCE6F0] rounded-xl shadow-xs text-xs font-semibold text-[#14283F]">
          <div className="w-6 h-6 rounded-lg bg-[#E8F4FF] flex items-center justify-center text-[#1687D9]">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[13px] font-bold text-[#14283F] leading-tight">Barshi, Solapur</div>
            <div className="text-[10px] text-[#8192A8] font-medium leading-tight">Maharashtra, India</div>
          </div>
        </div>
      </div>

      {/* Heat Map Must Appear First (Section 2 Specification) */}
      <motion.div variants={cardEntranceVariants} className="w-full">
        <BarshiDashboardHeatmap
          bins={bins}
          selectedBinId={selectedBinId}
          onSelectBin={setSelectedBinId}
        />
      </motion.div>

      {/* Selected Dustbin Live Telemetry Monitor (Section 5 Specification) */}
      <motion.div variants={cardEntranceVariants} className="w-full">
        <div className="bg-white rounded-3xl border border-[#DCE6F0] p-5 sm:p-6 shadow-[0_2px_12px_rgba(20,40,65,0.04)]">
          {/* Header row: Title + Device Source Badge + Bin Selector Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDF3F9] pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E8F4FF] text-[#1687D9] flex items-center justify-center shrink-0 shadow-2xs">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[#14283F]">
                    Live Dustbin Telemetry Monitor
                  </h2>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      currentSelected?.data_source === 'REAL'
                        ? 'bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]'
                        : 'bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]'
                    }`}
                  >
                    {currentSelected?.data_source === 'REAL' ? 'REAL HARDWARE NODE' : 'ISOLATED DEMO / TEST'}
                  </span>
                </div>
                <p className="text-xs text-[#526985] mt-0.5">
                  Real-time sensor telemetry and ultrasonic distance monitoring.
                </p>
              </div>
            </div>

            {/* Quick Bin Selector Dropdown */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <label htmlFor="dashboard-bin-selector" className="text-xs font-semibold text-[#526985]">
                Inspect:
              </label>
              <select
                id="dashboard-bin-selector"
                value={selectedBinId || ''}
                onChange={(e) => setSelectedBinId(e.target.value)}
                className="text-xs font-mono font-bold text-[#14283F] bg-[#F7FAFD] border border-[#DCE6F0] rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#1687D9] cursor-pointer"
              >
                <optgroup label="Real Physical Microcontrollers">
                  {realBins.map((b) => (
                    <option key={b.bin_id} value={b.bin_id}>
                      {b.bin_id} • {b.name || b.location}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Isolated Demo Fleet">
                  {demoBins.slice(0, 10).map((b) => (
                    <option key={b.bin_id} value={b.bin_id}>
                      {b.bin_id} • {b.name || b.location}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* 4 Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. BIN ID & Location */}
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#EDF3F9] flex flex-col justify-between">
              <span className="text-[10px] font-mono font-bold text-[#8192A8] uppercase tracking-wider block">
                Device Identity
              </span>
              <div className="my-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-[#14283F] block leading-none">
                  {currentSelected?.bin_id || '—'}
                </span>
                <span className="text-xs font-medium text-[#526985] block truncate mt-1">
                  {currentSelected?.name || currentSelected?.location || 'Barshi'}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0]/70 text-[11px] text-[#8192A8] truncate">
                Location: <span className="font-semibold text-[#14283F]">{currentSelected?.location || 'Ward 02'}</span>
              </div>
            </div>

            {/* 2. Ultrasonic Sensor Distance (cm) */}
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#EDF3F9] flex flex-col justify-between">
              <span className="text-[10px] font-mono font-bold text-[#8192A8] uppercase tracking-wider block">
                Sensor Distance
              </span>
              <div className="my-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-[#14283F] leading-none">
                    {currentSelected?.current_distance_cm !== undefined
                      ? currentSelected.current_distance_cm
                      : '—'}
                  </span>
                  <span className="text-xs font-bold text-[#526985]">cm</span>
                </div>
                <span className="text-xs text-[#8192A8] block mt-1">
                  Raw Ultrasonic Echo
                </span>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0]/70 text-[11px] text-[#8192A8]">
                Empty: 30cm &bull; Full: 5cm
              </div>
            </div>

            {/* 3. Fill Percentage & Capacity Status */}
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#EDF3F9] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#8192A8] uppercase tracking-wider block">
                  Fill Capacity
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                    currentSelected?.current_status === 'FULL'
                      ? 'bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA]'
                      : currentSelected?.current_status === 'HIGH'
                      ? 'bg-[#FEFCE8] text-[#CA8A04] border border-[#FEF08A]'
                      : currentSelected?.current_status === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {currentSelected?.current_status || 'LOW'}
                </span>
              </div>
              <div className="my-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-[#14283F] leading-none block">
                  {currentSelected?.current_fill_percent !== undefined
                    ? `${currentSelected.current_fill_percent}%`
                    : '—'}
                </span>
                {/* Visual Fill Bar */}
                <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all duration-300 ${
                      (currentSelected?.current_fill_percent || 0) >= 90
                        ? 'bg-[#EA580C]'
                        : (currentSelected?.current_fill_percent || 0) >= 80
                        ? 'bg-[#EAB308]'
                        : (currentSelected?.current_fill_percent || 0) >= 50
                        ? 'bg-[#F59E0B]'
                        : 'bg-[#16A66A]'
                    }`}
                    style={{ width: `${Math.min(currentSelected?.current_fill_percent || 0, 100)}%` }}
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0]/70 text-[11px] text-[#8192A8]">
                Threshold: {currentSelected?.current_status === 'FULL' ? 'Urgent Pickup Required' : 'Within Limits'}
              </div>
            </div>

            {/* 4. Connection State & Freshness */}
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#EDF3F9] flex flex-col justify-between">
              <span className="text-[10px] font-mono font-bold text-[#8192A8] uppercase tracking-wider block">
                Freshness &amp; State
              </span>
              <div className="my-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      currentSelected?.online
                        ? 'bg-[#16A66A] animate-pulse shadow-[0_0_8px_#16A66A]'
                        : 'bg-[#64748B]'
                    }`}
                  />
                  <span className="text-base sm:text-lg font-bold text-[#14283F] uppercase">
                    {currentSelected?.connection_state || (currentSelected?.online ? 'ONLINE' : 'OFFLINE')}
                  </span>
                </div>
                <span className="text-xs text-[#526985] font-mono block mt-1">
                  Updated: {currentSelected?.last_seen ? new Date(currentSelected.last_seen).toLocaleTimeString() : 'Just now'}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0]/70 text-[11px] text-[#8192A8] flex items-center justify-between">
                <span>Heartbeat: &lt; 5m</span>
                <span className="text-emerald-700 font-bold">SSE Active</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Six KPI Cards in 3x2 Grid Directly Below Heat Map (Section 3 Specification) */}
      <motion.div
        variants={dashboardStagger}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <motion.div
              key={card.id}
              variants={cardEntranceVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.99 }}
              className="h-full"
            >
              <Link
                to={card.linkTo}
                className={`group relative block h-full p-7 rounded-3xl border ${card.cardBorder} ${card.cardBg} shadow-[0_2px_10px_rgba(20,40,65,0.04)] hover:shadow-[0_12px_24px_rgba(20,40,65,0.08)] transition-all duration-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#1687D9] focus:ring-offset-2`}
              >
                {/* Top Row: Icon on left, circular arrow on right */}
                <div className="flex items-start justify-between relative z-10">
                  <div
                    className={`w-14 h-14 rounded-2xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shadow-xs`}
                  >
                    <Icon className="w-7 h-7" strokeWidth={2.2} />
                  </div>

                  <div
                    className={`w-10 h-10 rounded-full ${card.arrowBg} ${card.arrowColor} flex items-center justify-center transition-transform duration-200 group-hover:translate-x-1 shadow-2xs`}
                  >
                    <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Middle: Uppercase Label */}
                <div className="mt-5 relative z-10">
                  <span className="text-[11px] font-bold tracking-wider text-[#526985] uppercase">
                    {card.label}
                  </span>
                </div>

                {/* Main Metric Value */}
                <div className="mt-2 relative z-10">
                  <span
                    className={`text-5xl sm:text-6xl font-black tracking-tight ${
                      card.valueColor || 'text-[#14283F]'
                    }`}
                  >
                    {card.value}
                  </span>
                </div>

                {/* Bottom: Supporting Text */}
                <div className="mt-3 relative z-10">
                  <span
                    className={`text-xs ${
                      card.supportingColor || 'text-[#526985]'
                    }`}
                  >
                    {card.supportingText}
                  </span>
                </div>

                {/* Subtle Curved Wave Accent at Bottom-Right Corner (Exact Reference 1 Design) */}
                <svg
                  className="absolute right-0 bottom-0 pointer-events-none overflow-hidden rounded-br-3xl"
                  width="180"
                  height="110"
                  viewBox="0 0 180 110"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M0 110C70 110 90 55 180 35V110H0Z"
                    fill={card.waveColor}
                    opacity="0.38"
                  />
                  <path
                    d="M35 110C95 110 115 70 180 58V110H35Z"
                    fill={card.waveColor}
                    opacity="0.25"
                  />
                </svg>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};
export default DashboardPage;
