import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useMunicipal } from '../context/MunicipalContext';
import { BinDetailDrawer } from '../components/bins/BinDetailDrawer';
import { Bin } from '../types';
import {
  Trash2,
  Wifi,
  WifiOff,
  AlertTriangle,
  AlertCircle,
  Cpu,
  Search,
  Filter,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KpiFilterType,
  KPI_METAS,
  filterBinsByKpi,
} from '../utils/kpiFilters';

const ITEMS_PER_PAGE = 5; // Matches Reference Image 2 exact 5-row page size

export const DustbinsCatalogPage: React.FC = () => {
  const {
    bins,
    selectedBinId,
    selectedBin,
    selectedBinHistory,
    setSelectedBinId,
    simulateCollection,
  } = useMunicipal();

  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // Normalize URL filter parameter ('total' maps to 'all')
  const rawParam = (searchParams.get('filter') || 'all').toLowerCase();
  const activeFilter: KpiFilterType =
    rawParam === 'total' ? 'all' : (['all', 'online', 'offline', 'full', 'high', 'real'].includes(rawParam) ? (rawParam as KpiFilterType) : 'all');

  const meta = KPI_METAS[activeFilter];

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  // Step 1: Filter by active KPI criteria using single source of truth
  const kpiFilteredBins = useMemo(() => {
    return filterBinsByKpi(bins, activeFilter);
  }, [bins, activeFilter]);

  // Step 2: Apply search query
  const searchedBins = useMemo(() => {
    if (!searchQuery.trim()) return kpiFilteredBins;
    const q = searchQuery.toLowerCase().trim();
    return kpiFilteredBins.filter((bin) => {
      return (
        bin.bin_id.toLowerCase().includes(q) ||
        bin.name.toLowerCase().includes(q) ||
        bin.location.toLowerCase().includes(q) ||
        bin.ward.toLowerCase().includes(q)
      );
    });
  }, [kpiFilteredBins, searchQuery]);

  // Step 3: Pagination
  const totalItems = searchedBins.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedBins = useMemo(() => {
    return searchedBins.slice(startIndex, endIndex);
  }, [searchedBins, startIndex, endIndex]);

  // Master checkbox selection
  const allCurrentSelected =
    paginatedBins.length > 0 &&
    paginatedBins.every((b) => selectedRowIds.has(b.bin_id));

  const toggleSelectAll = () => {
    const next = new Set(selectedRowIds);
    if (allCurrentSelected) {
      paginatedBins.forEach((b) => next.delete(b.bin_id));
    } else {
      paginatedBins.forEach((b) => next.add(b.bin_id));
    }
    setSelectedRowIds(next);
  };

  const toggleSelectRow = (binId: string) => {
    const next = new Set(selectedRowIds);
    if (next.has(binId)) {
      next.delete(binId);
    } else {
      next.add(binId);
    }
    setSelectedRowIds(next);
  };

  const handleSelectFilter = (filterType: KpiFilterType) => {
    setSearchParams({ filter: filterType === 'all' ? 'total' : filterType });
    setFilterDropdownOpen(false);
  };

  const handleClearFilter = () => {
    setSearchParams({ filter: 'total' });
    setSearchQuery('');
  };

  const handleRowClick = (bin: Bin) => {
    setSelectedBinId(bin.bin_id);
    setDrawerOpen(true);
  };

  // Header icon config based on active filter
  const getHeaderIcon = () => {
    switch (activeFilter) {
      case 'online':
        return {
          icon: Wifi,
          bg: 'bg-[#E4F8EE]',
          color: 'text-[#16A66A]',
        };
      case 'offline':
        return {
          icon: WifiOff,
          bg: 'bg-[#F2F6FA]',
          color: 'text-[#5A7795]',
        };
      case 'full':
        return {
          icon: AlertTriangle,
          bg: 'bg-[#FFE9EB]',
          color: 'text-[#E54855]',
        };
      case 'high':
        return {
          icon: AlertCircle,
          bg: 'bg-[#FFF7ED]',
          color: 'text-[#EA580C]',
        };
      case 'real':
        return {
          icon: Cpu,
          bg: 'bg-[#E8F4FF]',
          color: 'text-[#1687D9]',
        };
      case 'all':
      default:
        return {
          icon: Trash2,
          bg: 'bg-[#E8F4FF]',
          color: 'text-[#1687D9]',
        };
    }
  };

  const headerIconConfig = getHeaderIcon();
  const HeaderIcon = headerIconConfig.icon;

  // Pagination page numbers generator
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* 1. Page Header (Reference Image 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Circular Icon Container */}
          <div
            className={`w-12 h-12 rounded-full ${headerIconConfig.bg} ${headerIconConfig.color} flex items-center justify-center shrink-0 shadow-2xs`}
          >
            <HeaderIcon className="w-6 h-6" strokeWidth={2.2} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#14283F] tracking-tight">
                {meta.title}
              </h1>
              {activeFilter !== 'all' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#E8F4FF] text-[#1687D9] border border-[#C8D7E6]">
                  {kpiFilteredBins.length} Bins
                </span>
              )}
            </div>
            <p className="text-xs text-[#526985] mt-0.5 font-medium">
              {meta.description}
            </p>
          </div>
        </div>

        {/* Back to Dashboard Navigation */}
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DCE6F0] text-xs font-semibold text-[#14283F] hover:bg-[#F0F5FB] hover:border-[#1687D9] transition-all duration-150 shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#526985]" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* 2. Search & Filter Bar (Reference Image 2) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar on Left */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8192A8]" />
          <input
            type="text"
            placeholder="Search bins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border border-[#DCE6F0] rounded-xl text-xs text-[#14283F] placeholder-[#8192A8] focus:outline-none focus:border-[#1687D9] focus:ring-2 focus:ring-[#1687D9]/20 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8192A8] hover:text-[#14283F]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdown on Right */}
        <div className="relative">
          <button
            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
            className={`h-10 px-4 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${
              activeFilter !== 'all'
                ? 'bg-[#E8F4FF] border-[#1687D9] text-[#1687D9]'
                : 'bg-white border-[#DCE6F0] text-[#14283F] hover:bg-[#F0F5FB]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            {activeFilter !== 'all' && (
              <span className="w-2 h-2 rounded-full bg-[#1687D9]" />
            )}
          </button>

          {/* Filter Dropdown Popover */}
          <AnimatePresence>
            {filterDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#DCE6F0] shadow-lg py-2 z-50 text-xs"
              >
                <div className="px-3.5 py-1.5 font-bold uppercase tracking-wider text-[10px] text-[#8192A8] border-b border-[#EDF3F9]">
                  Filter by Category
                </div>

                {(['all', 'online', 'offline', 'full', 'high', 'real'] as KpiFilterType[]).map(
                  (fType) => {
                    const isSelected = activeFilter === fType;
                    const fMeta = KPI_METAS[fType];
                    const count = filterBinsByKpi(bins, fType).length;

                    return (
                      <button
                        key={fType}
                        onClick={() => handleSelectFilter(fType)}
                        className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#E8F4FF] text-[#1687D9] font-bold'
                            : 'text-[#14283F] hover:bg-[#F7FAFD]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span className={isSelected ? 'font-bold' : ''}>
                            {fMeta.title}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-[#8192A8]">
                          {count}
                        </span>
                      </button>
                    );
                  }
                )}

                {activeFilter !== 'all' && (
                  <div className="border-t border-[#EDF3F9] mt-1 pt-1 px-2">
                    <button
                      onClick={handleClearFilter}
                      className="w-full py-1.5 text-center text-xs text-[#E54855] hover:bg-[#FFE9EB] rounded-lg font-semibold transition-colors cursor-pointer"
                    >
                      Clear Filter (Show All)
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Bin Table Card (Exact Reference Image 2 Styling) */}
      <div className="bg-white rounded-2xl border border-[#DCE6F0] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Table Header Row */}
            <thead>
              <tr className="border-b border-[#DCE6F0] text-[#526985] text-xs font-semibold">
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={allCurrentSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-[#DCE6F0] text-[#1687D9] focus:ring-0 cursor-pointer accent-[#1687D9]"
                    aria-label="Select all rows"
                  />
                </th>
                <th className="py-3.5 px-4 font-bold text-[#526985]">BIN_ID</th>
                <th className="py-3.5 px-4 font-bold text-[#526985]">Location</th>
                <th className="py-3.5 px-4 font-bold text-[#526985]">Fill %</th>
                <th className="py-3.5 px-4 font-bold text-[#526985]">Status</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#EDF3F9]">
              {paginatedBins.map((bin) => {
                const isChecked = selectedRowIds.has(bin.bin_id);
                const isOffline =
                  bin.connection_state === 'OFFLINE' || (!bin.online && bin.connection_state !== 'ONLINE');

                return (
                  <tr
                    key={bin.bin_id}
                    onClick={() => handleRowClick(bin)}
                    className={`transition-colors duration-150 cursor-pointer ${
                      isChecked
                        ? 'bg-[#E8F4FF]/60 hover:bg-[#E8F4FF]'
                        : 'hover:bg-[#F8FBFE]'
                    }`}
                  >
                    {/* Checkbox Column */}
                    <td
                      className="py-3.5 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectRow(bin.bin_id)}
                        className="w-4 h-4 rounded border-[#DCE6F0] text-[#1687D9] focus:ring-0 cursor-pointer accent-[#1687D9]"
                        aria-label={`Select ${bin.bin_id}`}
                      />
                    </td>

                    {/* BIN_ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#14283F]">
                      <div className="flex items-center gap-1.5">
                        <span>{bin.bin_id}</span>
                        {bin.data_source === 'REAL' && (
                          <span
                            className="text-[10px] text-[#1687D9] font-bold"
                            title="Physical Hardware Unit"
                          >
                            ★
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 font-medium text-[#14283F]">
                      {bin.location || bin.name}
                    </td>

                    {/* Fill % (Reference Image 2 shows '-' for OFFLINE bins) */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#14283F]">
                      {isOffline ? (
                        <span className="text-[#8192A8] font-normal">—</span>
                      ) : (
                        <span>{bin.current_fill_percent}%</span>
                      )}
                    </td>

                    {/* Status Badge (Matches Exact Reference Image 2 Badges) */}
                    <td className="py-3.5 px-4">
                      {isOffline ? (
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]">
                          OFFLINE
                        </span>
                      ) : bin.current_status === 'FULL' || bin.current_fill_percent >= 90 ? (
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-[#FFE9EB] text-[#E54855] border border-[#FCA5A5]">
                          FULL
                        </span>
                      ) : bin.current_status === 'HIGH' || bin.current_fill_percent >= 80 ? (
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-[#FFF7ED] text-[#EA580C] border border-[#FDBA74]">
                          HIGH
                        </span>
                      ) : bin.current_status === 'MEDIUM' || bin.current_fill_percent >= 50 ? (
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-[#FFF5D9] text-[#D99A12] border border-[#FCD34D]">
                          MEDIUM
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-[#E4F8EE] text-[#16A66A] border border-[#86EFAC]">
                          LOW
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {searchedBins.length === 0 && (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F0F5FB] text-[#8192A8] flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#14283F]">
              No bins match this filter
            </h3>
            <p className="text-xs text-[#526985] mt-1">
              Try adjusting your search query or reset the filter.
            </p>
            <button
              onClick={handleClearFilter}
              className="mt-4 px-4 py-2 rounded-xl bg-[#1687D9] text-white text-xs font-semibold hover:bg-[#0876C5] transition-colors cursor-pointer"
            >
              Reset to All Bins
            </button>
          </div>
        )}

        {/* 4. Pagination Controls (Exact Reference Image 2 Layout) */}
        {totalItems > 0 && (
          <div className="py-3 px-4 border-t border-[#DCE6F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Page Buttons on Left */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#526985] hover:bg-[#F0F5FB] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers().map((page, idx) => {
                if (page === '...') {
                  return (
                    <span
                      key={`dots-${idx}`}
                      className="w-8 h-8 flex items-center justify-center text-[#8192A8] font-mono"
                    >
                      ...
                    </span>
                  );
                }

                const pageNum = Number(page);
                const isActive = pageNum === currentPage;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#1687D9] text-white shadow-xs'
                        : 'text-[#526985] hover:bg-[#F0F5FB] hover:text-[#14283F]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#526985] hover:bg-[#F0F5FB] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Range Summary on Right */}
            <div className="text-xs font-semibold text-[#526985]">
              Showing {totalItems > 0 ? startIndex + 1 : 0}-{endIndex} of{' '}
              <span className="text-[#14283F] font-bold">{totalItems}</span> bins
            </div>
          </div>
        )}
      </div>

      {/* Slide-out details drawer */}
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

export default DustbinsCatalogPage;
