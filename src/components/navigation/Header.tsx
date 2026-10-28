import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useMunicipal } from '../../context/MunicipalContext';
import {
  LayoutDashboard,
  Map,
  Trash2,
  Flame,
  AlertTriangle,
  BarChart3,
  ListOrdered,
  Cpu,
  Settings,
  WifiOff,
  Menu,
  X,
  FileText,
  ClipboardCheck,
  Users,
  ChevronDown,
  User,
  Shield,
  HardHat,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Header: React.FC = () => {
  const {
    isLiveConnected,
    alerts,
    realBins,
    reports,
    tasks,
    currentRole,
    setCurrentRole,
  } = useMunicipal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const navigate = useNavigate();

  const activeAlertsCount = alerts.filter((a) => !a.resolved).length;
  const activeReportsCount = reports.filter((r) => r.status !== 'RESOLVED').length;
  const activeTasksCount = tasks.filter((t) => t.status !== 'VERIFIED').length;
  const realOnlineCount = realBins.filter((b) => b.connection_state === 'ONLINE' || b.online).length;

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/map', label: 'Live Map', icon: Map },
    { to: '/dustbins', label: 'Dustbins', icon: Trash2 },
    { to: '/heatmap', label: 'Heatmap', icon: Flame },
    { to: '/reports', label: 'Citizen Reports', icon: FileText, badge: activeReportsCount },
    { to: '/tasks', label: 'Field Tasks', icon: ClipboardCheck, badge: activeTasksCount },
    { to: '/workers', label: 'Workers', icon: Users },
    { to: '/alerts', label: 'Alerts', icon: AlertTriangle, badge: activeAlertsCount },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/priority', label: 'Collection Priority', icon: ListOrdered },
    { to: '/simulator', label: 'Demo Fleet', icon: Cpu },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const roles = [
    { id: 'AUTHORITY', label: 'Municipal Officer', path: '/', icon: Building2 },
    { id: 'CITIZEN', label: 'Citizen Reporting', path: '/citizen', icon: User },
    { id: 'WORKER', label: 'Sanitation Worker', path: '/worker', icon: HardHat },
    { id: 'SUPERVISOR', label: 'Ward Supervisor', path: '/supervisor', icon: Shield },
  ];

  const handleRoleSelect = (roleId: any, path: string) => {
    setCurrentRole(roleId);
    setRoleMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 border-b border-[#E2E8F0] shadow-xs backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title with Purple Design Language */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[#7C5CDB] flex items-center justify-center text-white shadow-xs transition-transform duration-150 group-hover:scale-105">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm sm:text-base text-[#0F172A] tracking-tight block">
                  Municipal Waste Platform
                </span>
                <span className="text-[10px] uppercase font-mono text-[#64748B] tracking-wider hidden sm:block">
                  Smart IoT Civic Command Center
                </span>
              </div>
            </Link>
          </div>

          {/* Center / Right: Role Selector & Hardware Status */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#7C5CDB] text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-[#7C5CDB]" />
                <span>Role: <strong className="text-[#7C5CDB]">{currentRole}</strong></span>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
              </button>

              <AnimatePresence>
                {roleMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-[#EDE9FE] py-1.5 z-50"
                  >
                    <div className="px-3 py-1 text-[10px] font-mono uppercase text-[#64748B] tracking-wider">
                      Switch Role View
                    </div>
                    {roles.map((r) => {
                      const Icon = r.icon;
                      const isCurrent = currentRole === r.id;
                      return (
                        <button
                          key={r.id}
                          onClick={() => handleRoleSelect(r.id, r.path)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-[#F1EDFF] text-[#7C5CDB] font-bold'
                              : 'text-[#334155] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-[#7C5CDB]" />
                          <span>{r.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Real Hardware Status Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1EDFF] border border-[#EDE9FE] text-xs text-[#7C5CDB] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#7C5CDB]" />
              <span>{realOnlineCount}/5 Real Bins Connected</span>
            </div>

            {/* Live SSE Stream Indicator */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                isLiveConnected
                  ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]'
                  : 'bg-[#FFF7ED] border-[#FED7AA] text-[#EA580C]'
              }`}
            >
              {isLiveConnected ? (
                <>
                  <span className="live-status-dot" />
                  <span>Live Stream Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>Polling Sync (15s)</span>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#64748B] hover:text-[#0F172A] rounded-lg cursor-pointer transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto border-t border-[#F1F5F9] py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#F1EDFF] text-[#7C5CDB] shadow-xs'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 ? (
                  <span className="text-[10px] px-1.5 py-0.2 bg-[#DC2626] text-white rounded-full font-bold ml-1">
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer with AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="lg:hidden border-t border-[#E2E8F0] bg-white px-4 py-3 space-y-1 shadow-lg overflow-hidden"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F1F5F9] text-xs">
              <span className="text-[#64748B]">Live SSE Stream:</span>
              <span className={isLiveConnected ? 'text-[#16A34A] font-bold' : 'text-[#EA580C]'}>
                {isLiveConnected ? 'Connected' : 'Polling Sync'}
              </span>
            </div>

            {/* Mobile Role Switcher */}
            <div className="grid grid-cols-2 gap-1.5 pb-2 mb-2 border-b border-[#F1F5F9]">
              {roles.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      handleRoleSelect(r.id, r.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold ${
                      currentRole === r.id
                        ? 'bg-[#F1EDFF] text-[#7C5CDB]'
                        : 'bg-[#F8FAFC] text-[#475569]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#F1EDFF] text-[#7C5CDB]'
                        : 'text-[#475569] hover:bg-[#F8FAFC]'
                    }`
                  }
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#DC2626] text-white rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
