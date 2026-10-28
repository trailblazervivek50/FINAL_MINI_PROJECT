import React from 'react';
import { Link } from 'react-router-dom';
import { useWasteSystem } from '../../context/WasteSystemContext';
import { Camera, MapPin, CheckCircle, Clock, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { STATUS_COLORS } from '../../config/thresholds';

export const CitizenHomePage: React.FC = () => {
  const { dustbins, reports } = useWasteSystem();

  // Find local bin (D-104 Market Area)
  const nearbyBin = dustbins.find((b) => b.id === 'D-104') || dustbins[0];
  const colors = STATUS_COLORS[nearbyBin.status];

  const resolvedCount = reports.filter((r) => r.status === 'RESOLVED').length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Editorial Civic Header */}
      <div className="border-b border-[rgba(26,26,24,0.15)] pb-6">
        <div className="font-mono text-xs uppercase tracking-widest text-[#6E6B64] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#5D7A62]" />
          <span>CIVIC CLEANLINESS INITIATIVE &bull; WARD 05</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A18] mt-1">
          Smart Waste Resident Portal
        </h1>
        <p className="text-sm text-[#6E6B64] mt-1 font-sans">
          Report full dustbins, monitor local bin levels, and hold municipal crews accountable in real time.
        </p>
      </div>

      {/* Primary CTA Card */}
      <div className="bg-[#1A1A18] text-[#F3F1EC] rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-[#B8892D] uppercase tracking-wider font-semibold">
            QUICK ACTION
          </span>
          <span className="font-mono text-xs text-[#A8A49D]">Average pickup: 18 min</span>
        </div>

        <div>
          <h2 className="font-serif text-2xl font-bold">
            Notice an Overflowing Dustbin?
          </h2>
          <p className="text-xs text-[#C0BDB4] mt-1">
            Snap a photo, verify the nearest bin, and dispatch the ward sanitation team.
          </p>
        </div>

        <Link
          to="/citizen/report"
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-[#F3F1EC] hover:bg-[#E9E6DF] text-[#1A1A18] font-sans font-bold text-xs transition cursor-pointer"
        >
          <Camera className="w-4 h-4 text-[#2F4B7C]" />
          <span>REPORT WASTE NOW</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Nearby Dustbin Card */}
      <div className="bg-[#E9E6DF] rounded-2xl border border-[rgba(26,26,24,0.15)] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(26,26,24,0.12)]">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-[#2F4B7C]" />
            <h3 className="font-serif text-base font-bold text-[#1A1A18]">
              Nearest Monitored Dustbin
            </h3>
          </div>
          <span className="font-mono text-xs font-bold text-[#1A1A18]">
            {nearbyBin.id}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-serif text-3xl font-bold text-[#1A1A18]">
              {nearbyBin.fillPercentage}% FULL
            </div>
            <div className="font-mono text-xs text-[#6E6B64] mt-0.5">
              {nearbyBin.area} &bull; {nearbyBin.ward}
            </div>
          </div>
          <span
            className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${colors.text} ${colors.bg}`}
          >
            {nearbyBin.status}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-[#F3F1EC] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${nearbyBin.fillPercentage}%`,
              backgroundColor: colors.hex,
            }}
          />
        </div>

        <div className="font-mono text-[11px] text-[#6E6B64] pt-1">
          Last sensor ping: {nearbyBin.lastUpdated} via ESP8266 IoT Node
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex justify-between items-center pt-4 border-t border-[rgba(26,26,24,0.15)]">
        <div className="font-mono text-xs text-[#6E6B64]">
          {resolvedCount} reports resolved today in your municipal sector.
        </div>
        <Link
          to="/citizen/reports"
          className="font-mono text-xs text-[#2F4B7C] font-semibold hover:underline flex items-center gap-1"
        >
          <span>Track My Reports</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
