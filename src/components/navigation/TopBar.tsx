import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  User,
  Shield,
  HardHat,
  Building2,
  Cpu,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useMunicipal } from '../../context/MunicipalContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../types';

interface TopBarProps {
  onToggleMobileSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleMobileSidebar }) => {
  const {
    isLiveConnected,
    alerts,
    realBins,
    currentRole,
    setCurrentRole,
    lastUpdateTimestamp
  } = useMunicipal();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const activeAlertsCount = alerts.filter((a) => !a.resolved).length;
  const onlineCount = realBins.filter((b) => b.online || b.connection_state === 'ONLINE').length;

  const roles: { id: UserRole; label: string; path: string; icon: React.ElementType }[] = [
    { id: 'AUTHORITY', label: 'Municipal Officer', path: '/', icon: Building2 },
    { id: 'CITIZEN', label: 'Citizen Reporting', path: '/citizen', icon: User },
    { id: 'WORKER', label: 'Sanitation Worker', path: '/worker', icon: HardHat },
    { id: 'SUPERVISOR', label: 'Ward Supervisor', path: '/supervisor/verification', icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#DCE6F0] h-16 px-4 sm:px-6 flex items-center justify-between shadow-2xs select-none">
      {/* Left: Mobile Menu Toggle & Search Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-[#526985] hover:text-[#14283F] hover:bg-[#F0F5FB] rounded-lg transition-colors cursor-pointer"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Quick Search */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F0F5FB] border border-[#DCE6F0] text-xs text-[#526985] w-56 md:w-72">
          <Search className="w-3.5 h-3.5 text-[#8192A8] shrink-0" />
          <input
            type="text"
            placeholder="Search bins, locations, reports..."
            className="bg-transparent border-none outline-none w-full text-xs text-[#14283F] placeholder-[#8192A8]"
          />
        </div>
      </div>

      {/* Right: Telemetry Indicators, Notifications & Role Selector */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Real Hardware Online Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F4FF] border border-[#BAE0FD] text-xs text-[#1687D9] font-semibold">
          <Cpu className="w-3.5 h-3.5" />
          <span>{onlineCount}/5 Real Bins</span>
        </div>

        {/* Live SSE Stream Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
            isLiveConnected
              ? 'bg-[#E4F8EE] border-[#A3E7C9] text-[#16A66A]'
              : 'bg-[#FFF5D9] border-[#FCE19B] text-[#D99A12]'
          }`}
          title={isLiveConnected ? 'Connected to live hardware stream' : 'Operating on polling fallback'}
        >
          {isLiveConnected ? (
            <>
              <span className="live-status-dot" />
              <span className="hidden sm:inline">LIVE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">POLLING</span>
            </>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => navigate('/alerts')}
            className="w-9 h-9 rounded-xl border border-[#DCE6F0] hover:border-[#C8D7E6] hover:bg-[#F0F5FB] flex items-center justify-center text-[#526985] hover:text-[#14283F] transition-colors relative cursor-pointer"
            title="Operational Alerts"
          >
            <Bell className="w-4 h-4" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4 text-[10px] font-bold bg-[#E54855] text-white rounded-full flex items-center justify-center">
                {activeAlertsCount}
              </span>
            )}
          </button>
        </div>

        {/* Role Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#DCE6F0] hover:border-[#1687D9] text-xs font-semibold text-[#14283F] transition-colors cursor-pointer shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-[#1687D9]" />
            <span className="hidden sm:inline text-[#8192A8]">Role:</span>
            <strong className="text-[#14283F]">{currentRole}</strong>
            <ChevronDown className="w-3.5 h-3.5 text-[#8192A8]" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#DCE6F0] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-1.5 text-[10px] uppercase font-bold text-[#8192A8] tracking-wider">
                Switch Role View
              </div>

              {roles.map((r) => {
                const Icon = r.icon;
                const isCurrent = currentRole === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setCurrentRole(r.id);
                      setRoleDropdownOpen(false);
                      navigate(r.path);
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-[#E8F4FF] text-[#1687D9] font-bold'
                        : 'text-[#526985] hover:bg-[#F0F5FB]'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#1687D9]" />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#0C223A] text-white flex items-center justify-center font-bold text-xs ring-1 ring-[#DCE6F0] shadow-xs">
          MC
        </div>
      </div>
    </header>
  );
};
