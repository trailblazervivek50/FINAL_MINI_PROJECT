import React, { useState } from 'react';
import { useMunicipal } from '../context/MunicipalContext';
import { LiveMunicipalMap } from '../components/map/LiveMunicipalMap';
import { BinDetailDrawer } from '../components/bins/BinDetailDrawer';
import { Map } from 'lucide-react';

export const LiveMapPage: React.FC = () => {
  const {
    bins,
    selectedBinId,
    selectedBin,
    selectedBinHistory,
    setSelectedBinId,
    simulateCollection,
  } = useMunicipal();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSelectBin = (binId: string) => {
    setSelectedBinId(binId);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-4.5 rounded-2xl border border-[#DCE6F0] shadow-card">
        <div>
          <h1 className="text-lg font-bold text-[#14283F] flex items-center gap-2">
            <Map className="w-5 h-5 text-[#1687D9]" />
            <span>Interactive Municipal GIS Map</span>
          </h1>
          <p className="text-xs text-[#526985]">
            Real-time geospatial locations of 5 physical dustbins and simulated municipal network.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-[#14283F] bg-[#F0F5FB] border border-[#DCE6F0] px-2.5 py-1 rounded-lg font-medium">
            Showing {bins.length} Active Dustbin Locations
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div className="h-[calc(100vh-230px)] min-h-[550px]">
        <LiveMunicipalMap
          bins={bins}
          selectedBinId={selectedBinId}
          onSelectBin={handleSelectBin}
        />
      </div>

      {/* Detail Drawer */}
      {drawerOpen && (
        <BinDetailDrawer
          bin={selectedBin}
          history={selectedBinHistory}
          onClose={() => setDrawerOpen(false)}
          onSimulateCollect={simulateCollection}
        />
      )}
    </div>
  );
};
