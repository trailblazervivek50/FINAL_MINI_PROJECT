import React, { useState } from 'react';
import { useWasteSystem } from '../../context/WasteSystemContext';
import { Wifi, WifiOff, Cpu, Sliders, Play, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { STATUS_COLORS } from '../../config/thresholds';

export const HardwareTelemetryBar: React.FC = () => {
  const {
    dustbins,
    hardwareMode,
    setHardwareMode,
    espConnectionStatus,
    setEspConnectionStatus,
    pushTelemetry,
    triggerDemoStepSequence,
    lastTelemetryTimestamp,
  } = useWasteSystem();

  const [isOpen, setIsOpen] = useState(false);
  const targetBin = dustbins.find((b) => b.id === 'D-104') || dustbins[0];

  const [sliderFill, setSliderFill] = useState<number>(targetBin.fillPercentage);
  const [sliderMoisture, setSliderMoisture] = useState<number>(targetBin.moisture);
  const [sliderDistance, setSliderDistance] = useState<number>(targetBin.distance);

  const handleSliderChange = (newFill: number) => {
    setSliderFill(newFill);
    const calculatedDist = Number(((100 - newFill) * 0.9).toFixed(1));
    setSliderDistance(calculatedDist);
    pushTelemetry({
      dustbinId: 'D-104',
      fillPercentage: newFill,
      distance: calculatedDist,
      moisture: sliderMoisture,
      timestamp: new Date().toISOString(),
    });
  };

  const handleMoistureChange = (newMoist: number) => {
    setSliderMoisture(newMoist);
    pushTelemetry({
      dustbinId: 'D-104',
      fillPercentage: sliderFill,
      distance: sliderDistance,
      moisture: newMoist,
      timestamp: new Date().toISOString(),
    });
  };

  const currentColors = STATUS_COLORS[targetBin.status];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pointer-events-auto">
        {/* Collapsible Panel */}
        {isOpen && (
          <div className="bg-[#1A1A18] text-[#F3F1EC] rounded-t-2xl p-5 border-t border-x border-[#333] shadow-2xl backdrop-blur transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2D2D2A]">
              <div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#B8892D]" />
                  <h3 className="font-serif text-lg font-semibold tracking-wide">
                    ESP8266 Hardware Telemetry Bridge
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#2D2D2A] text-[#E9E6DF]">
                    TARGET: D-104 (NODE #01)
                  </span>
                </div>
                <p className="text-xs text-[#A8A49D] mt-0.5">
                  Simulate live hardware changes or connect real ultrasonic (HC-SR04) + moisture sensor data packets.
                </p>
              </div>

              {/* Action shortcuts */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerDemoStepSequence()}
                  className="px-3 py-1.5 rounded text-xs font-medium bg-[#2F4B7C] hover:bg-[#3B5D98] text-[#F3F1EC] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run 72% → 91% Demo Sequence
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const newStatus = espConnectionStatus === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED';
                    setEspConnectionStatus(newStatus);
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 border transition-colors cursor-pointer ${
                    espConnectionStatus === 'CONNECTED'
                      ? 'border-[#5D7A62] text-[#86AB8B] hover:bg-[#5D7A62]/20'
                      : 'border-[#A63D40] text-[#E07A7C] hover:bg-[#A63D40]/20'
                  }`}
                >
                  {espConnectionStatus === 'CONNECTED' ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                  {espConnectionStatus === 'CONNECTED' ? 'Simulate Disconnect' : 'Reconnect Hardware'}
                </button>
              </div>
            </div>

            {/* Slider Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-xs font-sans">
              {/* Fill percentage */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#A8A49D]">Ultrasonic Fill Level:</span>
                  <span className="font-mono text-sm font-semibold text-[#F3F1EC]">
                    {targetBin.fillPercentage}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={targetBin.fillPercentage}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  className="w-full accent-[#2F4B7C] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#777]">
                  <span>0% (Empty)</span>
                  <span>50% (Normal)</span>
                  <span>85% (High)</span>
                  <span className="text-[#A63D40]">100% (Critical)</span>
                </div>
              </div>

              {/* Distance sensor */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#A8A49D]">Calculated Distance:</span>
                  <span className="font-mono text-sm font-semibold text-[#F3F1EC]">
                    {targetBin.distance.toFixed(1)} cm
                  </span>
                </div>
                <div className="bg-[#262624] p-2 rounded border border-[#333] text-[11px] font-mono text-[#C0BDB4]">
                  Height: 100 cm | Clearance: {targetBin.distance.toFixed(1)} cm
                </div>
              </div>

              {/* Moisture */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#A8A49D]">Moisture Sensor:</span>
                  <span className="font-mono text-sm font-semibold text-[#F3F1EC]">
                    {targetBin.moisture}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={targetBin.moisture}
                  onChange={(e) => handleMoistureChange(Number(e.target.value))}
                  className="w-full accent-[#B8892D] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#777]">
                  <span>Dry (&lt;30%)</span>
                  <span>Wet (&gt;60%)</span>
                </div>
              </div>
            </div>

            {/* Typed telemetry JSON view */}
            <div className="mt-4 pt-3 border-t border-[#2D2D2A] flex flex-col md:flex-row items-start md:items-center justify-between text-[11px] font-mono text-[#A8A49D] gap-2">
              <div className="flex items-center gap-3">
                <span className="text-white font-semibold">Active Telemetry Packet:</span>
                <code className="text-[#E9E6DF] bg-[#242422] px-2 py-0.5 rounded border border-[#383834]">
                  {`{"dustbinId":"${targetBin.id}","fillPercentage":${targetBin.fillPercentage},"distance":${targetBin.distance},"moisture":${targetBin.moisture}}`}
                </code>
              </div>
              <div className="text-[10px] text-[#888]">
                Broadcast channel: <span className="text-[#F3F1EC]">smart_garbage_telemetry_bus</span>
              </div>
            </div>
          </div>
        )}

        {/* Floating Trigger Dock */}
        <div className="bg-[#1A1A18] text-[#F3F1EC] px-4 py-2.5 rounded-t-xl border-t border-x border-[#333] shadow-lg flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            {/* Live / Demo Mode toggle */}
            <button
              type="button"
              onClick={() => setHardwareMode(hardwareMode === 'LIVE' ? 'DEMO' : 'LIVE')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#272725] hover:bg-[#333330] border border-[#3A3A36] transition-colors cursor-pointer"
              title="Toggle Live Hardware vs Demo Mode"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  hardwareMode === 'LIVE' ? 'bg-[#5D7A62] animate-pulse' : 'bg-[#B8892D]'
                }`}
              />
              <span className="font-mono text-[11px] font-medium tracking-wider">
                {hardwareMode === 'LIVE' ? '● LIVE HARDWARE' : '○ DEMO MODE'}
              </span>
            </button>

            {/* ESP Connection indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[#A8A49D]">
              {espConnectionStatus === 'CONNECTED' ? (
                <span className="text-[#5D7A62] flex items-center gap-1 font-semibold">
                  <Wifi className="w-3.5 h-3.5" /> ESP8266 CONNECTED
                </span>
              ) : (
                <span className="text-[#A63D40] flex items-center gap-1 font-semibold">
                  <WifiOff className="w-3.5 h-3.5" /> ESP8266 OFFLINE
                </span>
              )}
            </div>

            {/* D-104 Quick Metrics */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[#333] font-mono text-[11px]">
              <span className="text-[#A8A49D]">D-104:</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${currentColors.text} bg-[#2A2A26]`}>
                {targetBin.fillPercentage}% {targetBin.status}
              </span>
              <span className="text-[#777]">|</span>
              <span className="text-[#A8A49D]">{targetBin.distance} cm</span>
              <span className="text-[#777]">|</span>
              <span className="text-[#A8A49D]">{targetBin.moisture}% Moist</span>
            </div>

            <div className="text-[10px] font-mono text-[#888] hidden lg:block">
              UPDATED {lastTelemetryTimestamp}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => triggerDemoStepSequence()}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded bg-[#2F4B7C]/80 hover:bg-[#2F4B7C] text-[11px] font-medium transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Demo Step
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#2D2D2A] hover:bg-[#383834] text-[#F3F1EC] text-xs font-medium transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-[#B8892D]" />
              <span>{isOpen ? 'Close Telemetry Dock' : 'Hardware Telemetry Dock'}</span>
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
