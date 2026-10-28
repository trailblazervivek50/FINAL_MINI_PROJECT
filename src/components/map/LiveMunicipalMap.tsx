import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bin } from '../../types';
import { Search, Cpu } from 'lucide-react';

interface LiveMunicipalMapProps {
  bins: Bin[];
  selectedBinId: string | null;
  onSelectBin: (binId: string) => void;
  tileUrl?: string;
  attribution?: string;
}

function MapController({ selectedBin }: { selectedBin: Bin | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedBin) {
      map.flyTo([selectedBin.latitude, selectedBin.longitude], 16, { duration: 0.6 });
    }
  }, [selectedBin, map]);

  return null;
}

// Create custom semantic Leaflet divIcon with Purple Palette & Selection Ring (Section 9 & 23)
function createBinIcon(bin: Bin, isSelected: boolean, isRecentlyUpdated: boolean) {
  let color = '#16A34A'; // Green for LOW
  if (bin.connection_state === 'OFFLINE') {
    color = '#64748B'; // Slate
  } else if (bin.current_status === 'FULL') {
    color = '#DC2626'; // Red
  } else if (bin.current_status === 'HIGH') {
    color = '#EA580C'; // Orange
  } else if (bin.current_status === 'MEDIUM') {
    color = '#D97706'; // Amber
  }

  const isReal = bin.data_source === 'REAL';
  const selectedClass = isSelected ? 'marker-selected' : '';
  const updatedPulseStyle = isRecentlyUpdated
    ? 'animation: status-live-pulse 0.8s ease-out 1;'
    : '';

  const html = `
    <div class="custom-bin-marker ${selectedClass}" style="
      background-color: ${color};
      width: ${isSelected ? '36px' : '30px'};
      height: ${isSelected ? '36px' : '30px'};
      color: white;
      font-size: 11px;
      font-weight: 800;
      position: relative;
      ${updatedPulseStyle}
    ">
      <span>${bin.current_fill_percent}%</span>
      ${isReal ? `<span style="
        position: absolute;
        top: -5px;
        right: -5px;
        background: #1687D9;
        color: white;
        border: 1.5px solid white;
        border-radius: 50%;
        width: 14px;
        height: 14px;
        font-size: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.25);
      ">★</span>` : ''}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-bin-wrapper',
    iconSize: [isSelected ? 36 : 30, isSelected ? 36 : 30],
    iconAnchor: [isSelected ? 18 : 15, isSelected ? 18 : 15],
    popupAnchor: [0, -18],
  });
}

export const LiveMunicipalMap: React.FC<LiveMunicipalMapProps> = ({
  bins,
  selectedBinId,
  onSelectBin,
  tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution = '&copy; OpenStreetMap contributors',
}) => {
  const [filterSource, setFilterSource] = useState<'ALL' | 'REAL' | 'DEMO'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [recentlyUpdatedBins, setRecentlyUpdatedBins] = useState<Set<string>>(new Set());
  const prevBinsRef = useRef<Map<string, number>>(new Map());

  // Track telemetry changes for subtle 1-cycle marker update animation (Section 9)
  useEffect(() => {
    const updated = new Set<string>();
    bins.forEach((b) => {
      const prevFill = prevBinsRef.current.get(b.bin_id);
      if (prevFill !== undefined && prevFill !== b.current_fill_percent) {
        updated.add(b.bin_id);
      }
      prevBinsRef.current.set(b.bin_id, b.current_fill_percent);
    });

    if (updated.size > 0) {
      setRecentlyUpdatedBins(updated);
      const timer = setTimeout(() => {
        setRecentlyUpdatedBins(new Set());
      }, 900); // 1 cycle (600–1000ms as per Section 9) then stop
      return () => clearTimeout(timer);
    }
  }, [bins]);

  const selectedBin = useMemo(
    () => bins.find((b) => b.bin_id === selectedBinId) || null,
    [bins, selectedBinId]
  );

  const displayedBins = useMemo(() => {
    return bins.filter((bin) => {
      if (filterSource !== 'ALL' && bin.data_source !== filterSource) return false;
      if (filterStatus === 'OFFLINE' && bin.connection_state !== 'OFFLINE') return false;
      if (filterStatus !== 'ALL' && filterStatus !== 'OFFLINE' && bin.current_status !== filterStatus) return false;
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return (
          bin.bin_id.toLowerCase().includes(q) ||
          bin.name.toLowerCase().includes(q) ||
          bin.location.toLowerCase().includes(q) ||
          bin.ward.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bins, filterSource, filterStatus, searchQuery]);

  const defaultCenter: [number, number] = [18.5204, 73.8567];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-[#DCE6F0] overflow-hidden shadow-card">
      {/* Map Control Bar */}
      <div className="p-3.5 border-b border-[#DCE6F0] bg-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Control */}
          <div className="inline-flex rounded-xl border border-[#DCE6F0] bg-[#F0F5FB] p-0.5 text-xs font-semibold">
            <button
              onClick={() => setFilterSource('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterSource === 'ALL'
                  ? 'bg-white text-[#1687D9] shadow-xs font-bold'
                  : 'text-[#526985] hover:text-[#14283F]'
              }`}
            >
              All ({bins.length})
            </button>
            <button
              onClick={() => setFilterSource('REAL')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                filterSource === 'REAL'
                  ? 'bg-white text-[#1687D9] shadow-xs font-bold'
                  : 'text-[#526985] hover:text-[#14283F]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-[#1687D9]" />
              Real Physical (5)
            </button>
            <button
              onClick={() => setFilterSource('DEMO')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterSource === 'DEMO'
                  ? 'bg-white text-[#1687D9] shadow-xs font-bold'
                  : 'text-[#526985] hover:text-[#14283F]'
              }`}
            >
              Demo Fleet ({bins.length - 5})
            </button>
          </div>

          {/* Status Dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-white border border-[#DCE6F0] rounded-xl px-3 py-1.5 text-[#14283F] font-semibold focus:outline-none focus:border-[#1687D9] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="FULL">🔴 FULL (&ge;90%)</option>
            <option value="HIGH">🟠 HIGH (80-89%)</option>
            <option value="MEDIUM">🟡 MEDIUM (50-79%)</option>
            <option value="LOW">🟢 LOW (0-49%)</option>
            <option value="OFFLINE">⚪ OFFLINE (&gt;15 min)</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8192A8]" />
          <input
            type="text"
            placeholder="Search Bin ID, ward, area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-[#DCE6F0] rounded-xl text-[#14283F] focus:outline-none focus:border-[#1687D9] transition-colors placeholder-[#8192A8]"
          />
        </div>
      </div>

      {/* Map Container */}
      <div className="relative flex-1 min-h-[480px]">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer attribution={attribution} url={tileUrl} />
          <MapController selectedBin={selectedBin} />

          {displayedBins.map((bin) => {
            const isSelected = bin.bin_id === selectedBinId;
            const isUpdated = recentlyUpdatedBins.has(bin.bin_id);
            const icon = createBinIcon(bin, isSelected, isUpdated);

            return (
              <Marker
                key={bin.bin_id}
                position={[bin.latitude, bin.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectBin(bin.bin_id),
                }}
              >
                <Popup className="custom-bin-popup">
                  <div className="p-1 min-w-[220px]">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#F1F5F9]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-[#14283F]">{bin.bin_id}</span>
                        {bin.data_source === 'REAL' ? (
                          <span className="text-[10px] bg-[#E8F4FF] text-[#1687D9] px-1.5 py-0.5 rounded font-bold border border-[#C8D7E6]">
                            REAL
                          </span>
                        ) : (
                          <span className="text-[10px] bg-[#F7FAFD] text-[#526985] px-1.5 py-0.5 rounded font-medium">
                            DEMO
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        bin.current_status === 'FULL' ? 'bg-[#FEF2F2] text-[#DC2626]' :
                        bin.current_status === 'HIGH' ? 'bg-[#FFF7ED] text-[#EA580C]' :
                        bin.current_status === 'MEDIUM' ? 'bg-[#FFFBEB] text-[#D97706]' :
                        'bg-[#F0FDF4] text-[#16A34A]'
                      }`}>
                        {bin.current_status}
                      </span>
                    </div>

                    <div className="text-xs text-[#334155] mt-1.5">
                      <p className="font-bold text-[#0F172A]">{bin.name}</p>
                      <p className="text-[11px] text-[#64748B]">{bin.location} • {bin.ward}</p>
                    </div>

                    <div className="mt-2.5">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#64748B]">Fill Level:</span>
                        <span className="font-extrabold text-[#0F172A]">{bin.current_fill_percent}%</span>
                      </div>
                      <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            bin.current_fill_percent >= 90 ? 'bg-[#DC2626]' :
                            bin.current_fill_percent >= 80 ? 'bg-[#EA580C]' :
                            bin.current_fill_percent >= 50 ? 'bg-[#D97706]' : 'bg-[#16A34A]'
                          }`}
                          style={{ width: `${bin.current_fill_percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#F1F5F9] text-[11px]">
                      <div>
                        <span className="text-[#64748B] block">Distance:</span>
                        <span className="font-semibold text-[#0F172A]">{bin.current_distance_cm} cm</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block">State:</span>
                        <span className={`font-semibold ${bin.connection_state === 'ONLINE' ? 'text-[#16A34A]' : 'text-[#64748B]'}`}>
                          {bin.connection_state || 'ONLINE'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectBin(bin.bin_id)}
                      className="btn-primary w-full mt-3 !h-[34px] text-xs font-bold cursor-pointer"
                    >
                      View Live Telemetry
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Legend Overlay with Clean Card Styling */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md border border-[#DCE6F0] rounded-xl p-3 shadow-card text-xs">
          <div className="font-bold text-[#14283F] mb-1.5 text-[11px] uppercase tracking-wider">
            Marker Legend
          </div>
          <div className="grid grid-cols-2 gap-x-3.5 gap-y-1.5 text-[11px] text-[#526985] font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E54855]" />
              <span>Full (&ge;90%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
              <span>High (80-89%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D99A12]" />
              <span>Medium (50-79%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A66A]" />
              <span>Low (0-49%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8192A8]" />
              <span>Offline (&gt;15m)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1687D9]" />
              <span className="text-[#1687D9] font-bold">★ Real Device</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
