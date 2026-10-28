import React from 'react';
import { Dustbin } from '../../types';
import { STATUS_COLORS } from '../../config/thresholds';
import { Wifi, Radio, ArrowUpRight, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DustbinCard: React.FC<{
  dustbin: Dustbin;
  compact?: boolean;
}> = ({ dustbin, compact = false }) => {
  const navigate = useNavigate();
  const statusColors = STATUS_COLORS[dustbin.status];

  return (
    <div
      onClick={() => navigate(`/authority/dustbins/${dustbin.id}`)}
      className="bg-[#F3F1EC] rounded-xl border border-[rgba(26,26,24,0.15)] p-5 hover:border-[#1A1A18] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
    >
      {/* Top Bar */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-base font-bold text-[#1A1A18]">
                {dustbin.id}
              </span>
              {dustbin.isPhysicalHardware && (
                <span className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-[#2F4B7C] text-[#F3F1EC] font-semibold">
                  <Cpu className="w-2.5 h-2.5" />
                  ESP8266 HARDWARE
                </span>
              )}
            </div>
            <div className="text-xs text-[#6E6B64] font-medium mt-0.5">
              {dustbin.area.toUpperCase()} &bull; {dustbin.ward.toUpperCase()}
            </div>
          </div>

          <span
            className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${statusColors.text} ${statusColors.bg}`}
          >
            {dustbin.status}
          </span>
        </div>

        {/* Prominent Fill Percentage (Requirement 14 & 16) */}
        <div className="my-4">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-[#1A1A18]">
              {dustbin.fillPercentage}%
            </span>
            <span className="font-mono text-xs uppercase tracking-wider text-[#6E6B64]">
              CAPACITY
            </span>
          </div>

          {/* Fill Progress Bar */}
          <div className="w-full h-1.5 bg-[#E9E6DF] rounded-full overflow-hidden mt-2">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(dustbin.fillPercentage, 100)}%`,
                backgroundColor: statusColors.hex,
              }}
            />
          </div>
        </div>

        {/* Telemetry Sensor Specs */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(26,26,24,0.08)] font-mono text-xs">
          <div>
            <span className="block text-[10px] text-[#6E6B64]">ULTRASONIC</span>
            <span className="font-semibold text-[#1A1A18]">{dustbin.distance.toFixed(1)} cm</span>
          </div>
          <div>
            <span className="block text-[10px] text-[#6E6B64]">MOISTURE</span>
            <span className="font-semibold text-[#1A1A18]">{dustbin.moisture}%</span>
          </div>
        </div>
      </div>

      {/* Footer info: ESP8266 and Last Updated */}
      <div className="pt-3 mt-3 border-t border-[rgba(26,26,24,0.08)] flex items-center justify-between text-[11px] font-mono text-[#6E6B64]">
        <div className="flex items-center gap-1.5">
          <Wifi
            className={`w-3.5 h-3.5 ${
              dustbin.espConnection === 'CONNECTED' ? 'text-[#5D7A62]' : 'text-[#A63D40]'
            }`}
          />
          <span className="font-semibold text-[#1A1A18]">
            {dustbin.espConnection === 'CONNECTED' ? '● CONNECTED' : '○ OFFLINE'}
          </span>
        </div>

        <div className="flex items-center gap-1 group-hover:text-[#2F4B7C] transition-colors">
          <span>{dustbin.lastUpdated}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
