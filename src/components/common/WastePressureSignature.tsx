import React from 'react';
import { useWasteSystem } from '../../context/WasteSystemContext';
import { STATUS_COLORS } from '../../config/thresholds';
import { ArrowRight, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const WastePressureSignature: React.FC = () => {
  const { wards, selectedWardId, setSelectedWardId } = useWasteSystem();

  return (
    <div className="bg-[#E9E6DF] rounded-xl border border-[rgba(26,26,24,0.15)] p-5 md:p-6 my-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-4 border-b border-[rgba(26,26,24,0.12)]">
        <div>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#6E6B64]">
            SIGNATURE SYSTEM DIAGNOSTIC
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1A1A18] mt-0.5">
            Waste Pressure Across Municipal Sectors
          </h2>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs text-[#6E6B64]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#5D7A62]" /> Normal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#B8892D]" /> High
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#A63D40]" /> Critical
          </span>
        </div>
      </div>

      {/* The Spectrum Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-5">
        {wards.map((ward) => {
          const isSelected = selectedWardId === ward.id;
          const statusStyle = STATUS_COLORS[ward.wastePressure];

          return (
            <button
              key={ward.id}
              type="button"
              onClick={() => setSelectedWardId(ward.id)}
              className={`text-left p-4 rounded-lg border transition-all cursor-pointer relative overflow-hidden group ${
                isSelected
                  ? 'bg-[#F3F1EC] border-[#1A1A18] shadow-sm'
                  : 'bg-[#F3F1EC]/70 hover:bg-[#F3F1EC] border-[rgba(26,26,24,0.12)]'
              }`}
            >
              {/* Left semantic indicator line */}
              <div
                className="absolute top-0 bottom-0 left-0 w-1.5"
                style={{ backgroundColor: statusStyle.hex }}
              />

              <div className="pl-2">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs font-semibold text-[#1A1A18]">
                    {ward.name}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${statusStyle.text} ${statusStyle.bg}`}
                  >
                    {ward.wastePressure}
                  </span>
                </div>

                <div className="text-xs font-medium text-[#6E6B64] truncate mt-0.5">
                  {ward.areaName}
                </div>

                {/* Key operational metrics */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-[rgba(26,26,24,0.08)] font-mono text-[11px]">
                  <div>
                    <span className="block text-[10px] text-[#6E6B64]">CRIT BINS</span>
                    <span className="font-semibold text-[#1A1A18]">{ward.criticalBins}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#6E6B64]">REPORTS</span>
                    <span className="font-semibold text-[#1A1A18]">{ward.openReports}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#6E6B64]">RESP TIME</span>
                    <span className="font-semibold text-[#1A1A18]">{ward.averageResponseTime}</span>
                  </div>
                </div>

                {/* Progression relation indicator: AREA -> WASTE PRESSURE -> PRIORITY -> RESPONSE */}
                <div className="mt-3 flex items-center justify-between text-[11px] font-sans font-medium text-[#2F4B7C] group-hover:translate-x-0.5 transition-transform">
                  <span>Inspect Sector Detail</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
