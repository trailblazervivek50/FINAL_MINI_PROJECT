import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Bin } from '../../types';
import { Flame, ShieldAlert, Cpu } from 'lucide-react';

interface MunicipalHeatmapProps {
  bins: Bin[];
  onSelectBin?: (binId: string) => void;
  tileUrl?: string;
  attribution?: string;
}

export const MunicipalHeatmap: React.FC<MunicipalHeatmapProps> = ({
  bins,
  onSelectBin,
  tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution = '&copy; OpenStreetMap contributors',
}) => {
  const [filterSource, setFilterSource] = useState<'ALL' | 'REAL' | 'DEMO'>('ALL');
  const [minFillThreshold, setMinFillThreshold] = useState<number>(50); // Default to bins with >50% fill

  // Filter bins contributing to heat
  const heatBins = useMemo(() => {
    return bins.filter((bin) => {
      if (filterSource !== 'ALL' && bin.data_source !== filterSource) return false;
      return bin.current_fill_percent >= minFillThreshold;
    });
  }, [bins, filterSource, minFillThreshold]);

  // Group into hot-spot areas
  const hotspotAreas = useMemo(() => {
    const areaMap = new Map<string, { totalFill: number; count: number; highCount: number }>();
    bins.forEach((b) => {
      const cur = areaMap.get(b.ward) || { totalFill: 0, count: 0, highCount: 0 };
      cur.totalFill += b.current_fill_percent;
      cur.count++;
      if (b.current_fill_percent >= 80) cur.highCount++;
      areaMap.set(b.ward, cur);
    });

    return Array.from(areaMap.entries()).map(([ward, val]) => ({
      ward,
      avgFill: Math.round(val.totalFill / val.count),
      criticalCount: val.highCount,
    })).sort((a, b) => b.avgFill - a.avgFill);
  }, [bins]);

  const defaultCenter: [number, number] = [18.5204, 73.8567];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-[#DCE6F0] overflow-hidden shadow-card">
      {/* Control bar */}
      <div className="p-3.5 border-b border-[#DCE6F0] bg-[#F0F5FB] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#14283F]">
            <Flame className="w-4 h-4 text-[#EA580C]" />
            <span>Garbage Accumulation Heatmap</span>
          </div>

          {/* REAL / DEMO / ALL toggle */}
          <div className="inline-flex rounded-xl border border-[#DCE6F0] bg-white p-0.5 text-xs font-semibold">
            <button
              onClick={() => setFilterSource('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterSource === 'ALL'
                  ? 'bg-[#E8F4FF] text-[#1687D9] font-bold'
                  : 'text-[#526985] hover:text-[#14283F]'
              }`}
            >
              All Sources ({bins.length})
            </button>
            <button
              onClick={() => setFilterSource('REAL')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                filterSource === 'REAL'
                  ? 'bg-[#E8F4FF] text-[#1687D9] font-bold'
                  : 'text-[#526985] hover:text-[#14283F]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-[#1687D9]" />
              Real Hardware (5)
            </button>
            <button
              onClick={() => setFilterSource('DEMO')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterSource === 'DEMO'
                  ? 'bg-[#E8F4FF] text-[#1687D9] font-bold'
                  : 'text-[#526985] hover:text-[#14283F]'
              }`}
            >
              Demo Fleet
            </button>
          </div>
        </div>

        {/* Intensity threshold slider */}
        <div className="flex items-center gap-2 text-xs text-[#526985]">
          <span>Heat Threshold:</span>
          <input
            type="range"
            min="20"
            max="80"
            step="10"
            value={minFillThreshold}
            onChange={(e) => setMinFillThreshold(Number(e.target.value))}
            className="w-24 accent-[#1687D9] cursor-pointer"
          />
          <span className="font-mono font-bold text-[#14283F]">{minFillThreshold}%+</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-[480px]">
        {/* Heatmap canvas on Leaflet */}
        <div className="relative flex-1 min-h-[400px]">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer attribution={attribution} url={tileUrl} />

            {/* Heat aura radial circles weighted by fill percentage */}
            {heatBins.map((bin) => {
              const intensity = bin.current_fill_percent / 100;
              // Color spectrum: 50-70% yellow/amber, 70-85% orange, 85-100% deep red
              const heatColor =
                bin.current_fill_percent >= 90 ? '#DC2626' :
                bin.current_fill_percent >= 80 ? '#EA580C' :
                bin.current_fill_percent >= 65 ? '#D97706' : '#EAB308';

              // Radius scales with fill percent
              const outerRadius = 350 + (bin.current_fill_percent * 4);
              const coreRadius = 70 + (bin.current_fill_percent * 1.2);

              return (
                <React.Fragment key={`heat-${bin.bin_id}`}>
                  {/* Outer diffuse thermal dissipation circle */}
                  <Circle
                    center={[bin.latitude, bin.longitude]}
                    radius={outerRadius}
                    pathOptions={{
                      color: 'transparent',
                      fillColor: heatColor,
                      fillOpacity: 0.12 * intensity,
                    }}
                  />

                  {/* Mid thermal intensity circle */}
                  <Circle
                    center={[bin.latitude, bin.longitude]}
                    radius={coreRadius * 2}
                    pathOptions={{
                      color: 'transparent',
                      fillColor: heatColor,
                      fillOpacity: 0.28 * intensity,
                    }}
                  />

                  {/* Core hot center circle */}
                  <CircleMarker
                    center={[bin.latitude, bin.longitude]}
                    radius={coreRadius * 0.1}
                    pathOptions={{
                      color: heatColor,
                      weight: 1.5,
                      fillColor: heatColor,
                      fillOpacity: 0.85,
                    }}
                  >
                    <Popup>
                      <div className="p-1 text-xs">
                        <div className="font-bold text-[#0F172A]">{bin.bin_id} ({bin.name})</div>
                        <div className="text-[#64748B] mt-0.5">{bin.ward} • {bin.data_source}</div>
                        <div className="mt-1 font-semibold text-[#DC2626]">
                          Accumulation Heat: {bin.current_fill_percent}%
                        </div>
                        {onSelectBin && (
                          <button
                            onClick={() => onSelectBin(bin.bin_id)}
                            className="btn-primary mt-2 w-full !h-[30px] py-0 text-xs font-semibold cursor-pointer"
                          >
                            Inspect Bin
                          </button>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              );
            })}
          </MapContainer>

          {/* Thermal gradient legend */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur border border-[#DCE6F0] rounded-xl p-2.5 shadow-card text-xs">
            <div className="font-semibold text-[#14283F] mb-1 text-[11px] uppercase tracking-wider">
              Heat Intensity
            </div>
            <div className="h-2.5 w-36 rounded bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 mb-1" />
            <div className="flex justify-between text-[10px] text-[#8192A8] font-mono">
              <span>Moderate (50%)</span>
              <span>Critical (100%)</span>
            </div>
          </div>
        </div>

        {/* Municipal Hotspot Summary Panel */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-[#DCE6F0] p-4 bg-[#F7FAFD] overflow-y-auto">
          <div className="flex items-center gap-2 pb-3 border-b border-[#DCE6F0]">
            <ShieldAlert className="w-4 h-4 text-[#E54855]" />
            <h4 className="font-semibold text-xs text-[#14283F] uppercase tracking-wider">
              Area Waste Accumulation
            </h4>
          </div>
          <p className="text-xs text-[#526985] mt-1 mb-3">
            Ranked municipal zones by real-time garbage fill pressure.
          </p>

          <div className="space-y-2">
            {hotspotAreas.map((area, idx) => (
              <div
                key={area.ward}
                className="bg-white p-3 rounded-xl border border-[#DCE6F0] shadow-card flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-[#8192A8]">#{idx + 1}</span>
                    <span className="font-semibold text-xs text-[#14283F]">{area.ward}</span>
                  </div>
                  <div className="text-[11px] text-[#526985] mt-0.5">
                    {area.criticalCount > 0 ? (
                      <span className="text-[#E54855] font-semibold">{area.criticalCount} bins critical</span>
                    ) : (
                      <span className="text-[#16A66A]">Normal load</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-sm font-bold font-mono ${
                    area.avgFill >= 80 ? 'text-[#E54855]' :
                    area.avgFill >= 65 ? 'text-[#EA580C]' :
                    'text-[#D99A12]'
                  }`}>
                    {area.avgFill}%
                  </span>
                  <span className="text-[10px] text-[#8192A8] block">avg fill</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
