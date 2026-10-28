import React, { useState } from 'react';
import { useWasteSystem } from '../../context/WasteSystemContext';
import { STATUS_COLORS } from '../../config/thresholds';
import { useNavigate } from 'react-router-dom';
import { Trash2, Search, ArrowRight, Cpu, Wifi } from 'lucide-react';
import type { StatusLevel } from '../../types';

export const DustbinsListPage: React.FC = () => {
  const { dustbins } = useWasteSystem();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusLevel | 'ALL'>('ALL');

  const filteredBins = dustbins.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.ward.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="pb-6 border-b border-[rgba(26,26,24,0.15)] mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-[#6E6B64]">
            INFRASTRUCTURE ASSET REGISTER
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A18] mt-1">
            Monitored Smart Dustbins
          </h1>
          <p className="text-sm text-[#6E6B64] mt-1 font-sans">
            Inventory of IoT ultrasonic sensor units, telemetry intervals, and capacity state across wards.
          </p>
        </div>

        <div className="font-mono text-xs text-[#6E6B64]">
          TOTAL REGISTERED: <span className="font-bold text-[#1A1A18]">{dustbins.length} UNITS</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-[#E9E6DF] p-3 rounded-xl border border-[rgba(26,26,24,0.12)]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6E6B64] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID (e.g. D-104) or Area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F3F1EC] pl-9 pr-4 py-2 rounded-lg text-xs font-sans text-[#1A1A18] placeholder-[#6E6B64] border border-[rgba(26,26,24,0.1)] focus:outline-none"
          />
        </div>

        <div className="flex items-center bg-[#F3F1EC] p-0.5 rounded-lg border border-[rgba(26,26,24,0.1)] text-xs font-mono">
          {(['ALL', 'CRITICAL', 'HIGH', 'NORMAL'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                statusFilter === s
                  ? 'bg-[#1A1A18] text-[#F3F1EC] font-semibold'
                  : 'text-[#6E6B64] hover:text-[#1A1A18]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Editorial Table */}
      <div className="bg-[#F3F1EC] rounded-2xl border border-[rgba(26,26,24,0.15)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-[#E9E6DF] border-b border-[rgba(26,26,24,0.12)] font-mono text-[11px] text-[#6E6B64] uppercase tracking-wider">
                <th className="py-3 px-4">DUSTBIN ID</th>
                <th className="py-3 px-4">WARD & AREA</th>
                <th className="py-3 px-4">CAPACITY FILL</th>
                <th className="py-3 px-4">ULTRASONIC</th>
                <th className="py-3 px-4">MOISTURE</th>
                <th className="py-3 px-4">HARDWARE LINK</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(26,26,24,0.08)]">
              {filteredBins.map((bin) => {
                const colors = STATUS_COLORS[bin.status];
                return (
                  <tr
                    key={bin.id}
                    className="hover:bg-[#E9E6DF]/50 transition cursor-pointer"
                    onClick={() => navigate(`/authority/dustbins/${bin.id}`)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1A1A18]">
                      <div className="flex items-center gap-1.5">
                        <span>{bin.id}</span>
                        {bin.isPhysicalHardware && (
                          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#2F4B7C] text-white">
                            ESP8266
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1A1A18]">{bin.ward}</div>
                      <div className="text-[11px] text-[#6E6B64]">{bin.area}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#1A1A18] w-8">
                          {bin.fillPercentage}%
                        </span>
                        <div className="w-20 h-1.5 bg-[#E9E6DF] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(bin.fillPercentage, 100)}%`,
                              backgroundColor: colors.hex,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#1A1A18]">
                      {bin.distance.toFixed(1)} cm
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#1A1A18]">
                      {bin.moisture}%
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Wifi
                          className={`w-3.5 h-3.5 ${
                            bin.espConnection === 'CONNECTED' ? 'text-[#5D7A62]' : 'text-[#A63D40]'
                          }`}
                        />
                        <span className="text-[11px] text-[#1A1A18]">
                          {bin.espConnection === 'CONNECTED' ? 'Connected' : 'Offline'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${colors.text} ${colors.bg}`}
                      >
                        {bin.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/authority/dustbins/${bin.id}`);
                        }}
                        className="p-1.5 rounded bg-[#1A1A18] hover:bg-[#2F4B7C] text-[#F3F1EC] transition cursor-pointer"
                        title="View Telemetry"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
