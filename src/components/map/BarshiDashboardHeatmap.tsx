import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bin } from '../../types';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Radio, ExternalLink, Flame } from 'lucide-react';

interface BarshiDashboardHeatmapProps {
  bins: Bin[];
  selectedBinId?: string | null;
  onSelectBin?: (binId: string) => void;
  heightClass?: string;
}

// Fixed geographic center for Barshi, Solapur District, Maharashtra, India
const BARSHI_CENTER: [number, number] = [18.2335, 75.6943];
const BARSHI_DEFAULT_ZOOM = 14;

// Map Controller for programmatically flying or re-centering to Barshi
function MapController({
  selectedBin,
  recenterTrigger,
}: {
  selectedBin: Bin | null;
  recenterTrigger: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedBin && selectedBin.latitude && selectedBin.longitude) {
      map.flyTo([selectedBin.latitude, selectedBin.longitude], 16, { duration: 0.6 });
    }
  }, [selectedBin, map]);

  useEffect(() => {
    if (recenterTrigger > 0) {
      map.flyTo(BARSHI_CENTER, BARSHI_DEFAULT_ZOOM, { duration: 0.6 });
    }
  }, [recenterTrigger, map]);

  return null;
}

// Create semantic Leaflet divIcon with status dot and slow, subtle glowing halo
// Color Palette: Black -> Yellow -> Amber -> Orange -> Red (Full only)
function createBarshiDotIcon(bin: Bin, isSelected: boolean) {
  const isOffline = bin.connection_state === 'OFFLINE' || !bin.online;
  let color = '#FACC15'; // Low (<50%): Golden Yellow

  if (isOffline) {
    color = '#64748B'; // Offline: Slate Gray
  } else if (bin.current_status === 'FULL' || bin.current_fill_percent >= 90) {
    color = '#EF4444'; // Full (>=90%): Crimson Red
  } else if (bin.current_status === 'HIGH' || bin.current_fill_percent >= 80) {
    color = '#FF6B00'; // High (80-89%): Radiant Bright Orange
  } else if (bin.current_status === 'MEDIUM' || bin.current_fill_percent >= 50) {
    color = '#F59E0B'; // Medium (50-79%): Amber / Yellow-Orange
  }

  const isReal = bin.data_source === 'REAL';
  const selectedClass = isSelected ? 'is-selected' : '';
  const haloHtml = !isOffline
    ? `<div class="barshi-bin-halo" style="background-color: ${color};"></div>`
    : '';

  const realBadgeHtml = isReal
    ? `<div style="
        position: absolute;
        top: -3px;
        right: -3px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: #00B4D8;
        border: 1px solid #0B131F;
        box-shadow: 0 0 4px rgba(0, 180, 216, 0.9);
        z-index: 3;
      "></div>`
    : '';

  const html = `
    <div class="barshi-bin-dot-wrapper">
      ${haloHtml}
      <div class="barshi-bin-dot ${selectedClass}" style="background-color: ${color};">
        ${realBadgeHtml}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'barshi-custom-leaflet-icon',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

// Relative time helper
function formatRelativeTime(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    return `${Math.floor(diffHour / 24)}d ago`;
  } catch {
    return 'Recent';
  }
}

export const BarshiDashboardHeatmap: React.FC<BarshiDashboardHeatmapProps> = ({
  bins,
  selectedBinId = null,
  onSelectBin,
  heightClass = 'h-[340px] sm:h-[370px]',
}) => {
  const [recenterTrigger, setRecenterTrigger] = React.useState(0);

  // Filter bins with valid Barshi coordinates (ensuring no 0,0 or nulls)
  const validBins = useMemo(() => {
    return bins.filter(
      (b) =>
        typeof b.latitude === 'number' &&
        typeof b.longitude === 'number' &&
        !isNaN(b.latitude) &&
        !isNaN(b.longitude) &&
        b.latitude !== 0 &&
        b.longitude !== 0
    );
  }, [bins]);

  const selectedBin = useMemo(
    () => validBins.find((b) => b.bin_id === selectedBinId) || null,
    [validBins, selectedBinId]
  );

  // Bins that actively emit heat aura (online and have fill level)
  const thermalBins = useMemo(() => {
    return validBins.filter(
      (b) => b.connection_state !== 'OFFLINE' && b.online && b.current_fill_percent > 0
    );
  }, [validBins]);

  return (
    <div className="relative bg-[#0B131F] rounded-2xl border border-[#1E293B] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
      {/* Top-Left Geographic Context Pill */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0B131F]/90 backdrop-blur-md border border-[#1E293B] rounded-xl shadow-lg text-xs font-semibold text-[#F8FAFC]">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse"></span>
          <span>Barshi Municipal Live Grid</span>
          <span className="text-[#94A3B8] font-normal">({validBins.length} Bins Mapped)</span>
        </div>

        <button
          type="button"
          onClick={() => setRecenterTrigger((prev) => prev + 1)}
          title="Recenter to Barshi"
          className="p-1.5 bg-[#0B131F]/90 backdrop-blur-md border border-[#1E293B] hover:border-[#F59E0B] rounded-xl shadow-lg text-[#94A3B8] hover:text-[#F59E0B] transition-colors cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top-Right Compact Legend: Black -> Yellow -> Orange Theme (Section 2) */}
      <div className="absolute top-3 right-3 z-[1000] bg-[#0B131F]/92 backdrop-blur-md border border-[#1E293B] rounded-xl p-3 shadow-xl text-xs pointer-events-auto max-w-[280px]">
        {/* Heat intensity gradient description */}
        <div className="flex items-center justify-between text-[11px] font-bold text-[#F8FAFC] uppercase tracking-wider mb-2">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>Heat & Fill Level</span>
          </div>
        </div>

        {/* Gradient Intensity Bar: Black -> Yellow -> Amber -> Bright Orange */}
        <div className="mb-2.5">
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#FACC15] via-[#F59E0B] via-[#FF6B00] to-[#EF4444] shadow-inner" />
          <div className="flex justify-between items-center text-[9px] text-[#94A3B8] font-mono mt-1">
            <span>Low (Yellow)</span>
            <span>Med (Amber)</span>
            <span>High (Orange)</span>
          </div>
        </div>

        {/* Status Swatches */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] font-medium text-[#CBD5E1] pt-1.5 border-t border-[#1E293B]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block shadow-sm"></span>
            <span>Full (≥90%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] inline-block shadow-sm"></span>
            <span>High (80–89%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block shadow-sm"></span>
            <span>Med (50–79%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15] inline-block shadow-sm"></span>
            <span>Low (&lt;50%)</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#64748B] inline-block shadow-sm"></span>
            <span>Offline (Inactive)</span>
          </div>
        </div>
      </div>

      {/* Leaflet Map Canvas with Official Free OpenStreetMap Tiles + Charcoal Dark Filter (Zero Watermarks) */}
      <div className={`w-full ${heightClass}`}>
        <MapContainer
          center={BARSHI_CENTER}
          zoom={BARSHI_DEFAULT_ZOOM}
          scrollWheelZoom={false}
          className="w-full h-full bg-[#0A0F1D]"
        >
          <MapController selectedBin={selectedBin} recenterTrigger={recenterTrigger} />

          {/* Public OpenStreetMap raster tiles with dark charcoal CSS filter — 100% permitted, zero API key required, zero watermarks */}
          <TileLayer
            className="dark-charcoal-tiles"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Thermal Intensity Layer: Subtle, restrained glowing auras in Black -> Yellow -> Orange spectrum */}
          {thermalBins.map((bin) => {
            const fill = bin.current_fill_percent;
            let auraColor = '#FACC15'; // Low (<50%): Yellow
            let outerRadius = 18;
            let innerRadius = 8;
            let outerOpacity = 0.10;
            let innerOpacity = 0.18;

            if (fill >= 90) {
              // Critical Full: Deep Red-Orange Accent Core with Orange Aura
              auraColor = '#EF4444';
              outerRadius = 40;
              innerRadius = 18;
              outerOpacity = 0.16;
              innerOpacity = 0.32;
            } else if (fill >= 80) {
              // High: Radiant Bright Orange
              auraColor = '#FF6B00';
              outerRadius = 32;
              innerRadius = 15;
              outerOpacity = 0.14;
              innerOpacity = 0.28;
            } else if (fill >= 50) {
              // Medium: Warm Amber
              auraColor = '#F59E0B';
              outerRadius = 25;
              innerRadius = 12;
              outerOpacity = 0.12;
              innerOpacity = 0.22;
            }

            return (
              <React.Fragment key={`aura-${bin.bin_id}`}>
                {/* Diffuse thermal aura - tight, restrained radius */}
                <Circle
                  center={[bin.latitude, bin.longitude]}
                  radius={outerRadius}
                  pathOptions={{
                    stroke: false,
                    fillColor: auraColor,
                    fillOpacity: outerOpacity,
                  }}
                />
                {/* Inner glowing thermal core */}
                <Circle
                  center={[bin.latitude, bin.longitude]}
                  radius={innerRadius}
                  pathOptions={{
                    stroke: false,
                    fillColor: auraColor,
                    fillOpacity: innerOpacity,
                  }}
                />
              </React.Fragment>
            );
          })}

          {/* Registered Bin Markers: Small circular pulsing dots at exact coordinates */}
          {validBins.map((bin) => {
            const isSelected = bin.bin_id === selectedBinId;
            const icon = createBarshiDotIcon(bin, isSelected);
            const isOffline = bin.connection_state === 'OFFLINE' || !bin.online;

            return (
              <Marker
                key={bin.bin_id}
                position={[bin.latitude, bin.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    if (onSelectBin) {
                      onSelectBin(bin.bin_id);
                    }
                  },
                }}
              >
                <Popup className="barshi-leaflet-popup" minWidth={230} maxWidth={290}>
                  <div className="p-3.5 text-xs bg-[#0B131F] text-[#F8FAFC]">
                    {/* Header: BIN_ID, REAL/DEMO badge, Status Badge */}
                    <div className="flex items-center justify-between gap-2 border-b border-[#1E293B] pb-2.5 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white font-mono text-sm">
                          {bin.bin_id}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            bin.data_source === 'REAL'
                              ? 'bg-[#00B4D8]/20 text-[#00B4D8] border border-[#00B4D8]/40'
                              : 'bg-[#1E293B] text-[#94A3B8] border border-[#334155]'
                          }`}
                        >
                          {bin.data_source === 'REAL' ? 'REAL HARDWARE' : 'DEMO FLEET'}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOffline
                            ? 'bg-[#1E293B] text-[#94A3B8] border border-[#334155]'
                            : bin.current_status === 'FULL'
                            ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                            : bin.current_status === 'HIGH'
                            ? 'bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/40'
                            : bin.current_status === 'MEDIUM'
                            ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                            : 'bg-[#FACC15]/20 text-[#FACC15] border border-[#FACC15]/40'
                        }`}
                      >
                        {isOffline ? 'OFFLINE' : bin.current_status}
                      </span>
                    </div>

                    {/* Location Description */}
                    <div className="mb-2.5">
                      <div className="font-semibold text-white text-[12px] truncate">
                        {bin.name || bin.location}
                      </div>
                      <div className="text-[#94A3B8] text-[11px] truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#FF6B00] shrink-0" />
                        <span>{bin.location}</span>
                      </div>
                    </div>

                    {/* Fill Level Metric Box & Connectivity */}
                    <div className="mb-3 bg-[#111C2E] p-2.5 rounded-xl border border-[#1E293B]">
                      <div className="flex justify-between items-center text-[11px] mb-1.5">
                        <span className="text-[#94A3B8]">
                          Connectivity: <span className={isOffline ? 'text-[#EF4444]' : 'text-[#10B981]'}>{isOffline ? 'OFFLINE' : 'ONLINE'}</span>
                        </span>
                        <span className="font-bold text-white font-mono">
                          {isOffline ? '—' : `${bin.current_fill_percent}%`}
                        </span>
                      </div>
                      <div className="w-full bg-[#1E293B] h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            bin.current_status === 'FULL'
                              ? 'bg-gradient-to-r from-[#FF6B00] to-[#EF4444]'
                              : bin.current_status === 'HIGH'
                              ? 'bg-gradient-to-r from-[#F59E0B] to-[#FF6B00]'
                              : bin.current_status === 'MEDIUM'
                              ? 'bg-gradient-to-r from-[#FACC15] to-[#F59E0B]'
                              : 'bg-[#FACC15]'
                          }`}
                          style={{ width: `${Math.min(bin.current_fill_percent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-[#64748B] mt-1.5 font-mono">
                        <span>Distance: {isOffline ? '—' : `${bin.current_distance_cm} cm`}</span>
                        <span>{formatRelativeTime(bin.last_seen)}</span>
                      </div>
                    </div>

                    {/* Action link */}
                    <Link
                      to={`/bins?filter=total`}
                      className="inline-flex items-center justify-center w-full gap-1.5 py-2 text-center font-bold text-xs text-white bg-[#FF6B00] hover:bg-[#E55B00] rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      <span>View in Bins Catalog</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default BarshiDashboardHeatmap;
