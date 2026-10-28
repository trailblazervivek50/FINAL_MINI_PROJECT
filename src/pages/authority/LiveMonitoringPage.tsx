import React, { useState } from 'react';
import { useWasteSystem } from '../../context/WasteSystemContext';
import { DustbinCard } from '../../components/monitoring/DustbinCard';
import type { StatusLevel } from '../../types';
import { Search, Filter, Radio, Cpu, RefreshCw } from 'lucide-react';

export const LiveMonitoringPage: React.FC = () => {
  const { dustbins, triggerDemoStepSequence } = useWasteSystem();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusLevel | 'ALL'>('ALL');
  const [onlyHardware, setOnlyHardware] = useState(false);

  const filteredBins = dustbins.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.ward.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesHardware = !onlyHardware || b.isPhysicalHardware;

    return matchesSearch && matchesStatus && matchesHardware;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[rgba(26,26,24,0.15)] mb-8">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-[#6E6B64] flex items-center gap-2">
            <span>TELEMETRY STREAM</span>
            <span>&bull;</span>
            <span className="text-[#2F4B7C] font-semibold flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" /> SENSOR NETWORK
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A18] mt-1">
            Live Dustbin Monitoring
          </h1>
          <p className="text-sm text-[#6E6B64] mt-1 font-sans">
            Real-time ultrasonic capacity, moisture, and Wi-Fi connection feeds across municipal hardware nodes.
          </p>
        </div>

        {/* Quick Demo Trigger */}
        <button
          type="button"
          onClick={() => triggerDemoStepSequence()}
          className="px-4 py-2 rounded-lg bg-[#1A1A18] hover:bg-[#2F4B7C] text-[#F3F1EC] text-xs font-mono font-medium flex items-center gap-2 transition cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Simulate 72% &rarr; 91% Sequence</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-8 bg-[#E9E6DF] p-3 rounded-xl border border-[rgba(26,26,24,0.12)]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6E6B64] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Dustbin ID (e.g. D-104), Area, or Ward..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F3F1EC] pl-9 pr-4 py-2 rounded-lg text-xs font-sans text-[#1A1A18] placeholder-[#6E6B64] border border-[rgba(26,26,24,0.1)] focus:outline-none focus:border-[#1A1A18]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
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

          {/* Only physical hardware button */}
          <button
            type="button"
            onClick={() => setOnlyHardware(!onlyHardware)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition cursor-pointer ${
              onlyHardware
                ? 'bg-[#2F4B7C] text-white border-[#2F4B7C]'
                : 'bg-[#F3F1EC] text-[#6E6B64] border-[rgba(26,26,24,0.1)] hover:text-[#1A1A18]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>ESP8266 Only</span>
          </button>
        </div>
      </div>

      {/* Grid of dustbins */}
      {filteredBins.length === 0 ? (
        <div className="text-center py-16 bg-[#E9E6DF]/50 rounded-2xl border border-[rgba(26,26,24,0.1)]">
          <p className="font-serif text-lg text-[#1A1A18]">No dustbins match your filter criteria.</p>
          <p className="text-xs text-[#6E6B64] mt-1">Try resetting search or status filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBins.map((bin) => (
            <DustbinCard key={bin.id} dustbin={bin} />
          ))}
        </div>
      )}
    </div>
  );
};
