import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useWasteSystem } from '../../context/WasteSystemContext';
import {
  Activity,
  Layers,
  MapPin,
  Trash2,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Menu,
  X,
  Radio,
  FileText,
  UserCheck,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  badge?: number;
}

export const Navbar: React.FC = () => {
  const { currentRole, reports, tasks } = useWasteSystem();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pendingReportsCount = reports.filter((r) => r.status === 'UNDER REVIEW').length;
  const pendingTasksCount = tasks.filter((t) => t.status === 'ASSIGNED' || t.status === 'IN PROGRESS').length;
  const pendingVerificationsCount = tasks.filter((t) => t.status === 'COMPLETED').length;

  const authorityNav: NavItem[] = [
    { to: '/authority', label: 'Command Center', icon: Activity, end: true },
    { to: '/authority/monitoring', label: 'Live Monitoring', icon: Radio },
    { to: '/authority/heatmap', label: 'Area Heatmap', icon: MapPin },
    { to: '/authority/dustbins', label: 'Dustbins', icon: Trash2 },
    { to: '/authority/reports', label: 'Reports', icon: AlertCircle, badge: pendingReportsCount },
    { to: '/authority/tasks', label: 'Tasks', icon: Layers, badge: pendingTasksCount },
    { to: '/authority/workers', label: 'Workers', icon: UserCheck },
    { to: '/authority/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const workerNav: NavItem[] = [
    { to: '/worker', label: 'Dashboard', icon: Activity, end: true },
    { to: '/worker/tasks', label: 'My Tasks', icon: Layers, badge: pendingTasksCount },
  ];

  const supervisorNav: NavItem[] = [
    { to: '/supervisor', label: 'Operations', icon: Activity, end: true },
    { to: '/supervisor/verification', label: 'Verification', icon: CheckCircle2, badge: pendingVerificationsCount },
    { to: '/supervisor/workers', label: 'Workers', icon: UserCheck },
  ];

  const citizenNav: NavItem[] = [
    { to: '/citizen', label: 'Home', icon: Activity, end: true },
    { to: '/citizen/report', label: 'Report Waste', icon: AlertCircle },
    { to: '/citizen/reports', label: 'My Reports', icon: FileText },
  ];

  const activeNavItems =
    currentRole === 'AUTHORITY'
      ? authorityNav
      : currentRole === 'WORKER'
      ? workerNav
      : currentRole === 'SUPERVISOR'
      ? supervisorNav
      : citizenNav;

  return (
    <header className="border-b border-[rgba(26,26,24,0.15)] bg-[#F3F1EC] sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <Link to={`/${currentRole.toLowerCase()}`} className="flex items-baseline gap-2.5 group">
              <span className="font-serif text-2xl font-bold tracking-tight text-[#1A1A18] group-hover:text-[#2F4B7C] transition-colors">
                SMART GARBAGE
              </span>
              <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-widest text-[#6E6B64] border-l border-[rgba(26,26,24,0.15)] pl-2.5">
                IoT Civic Response Platform
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-1">
            {activeNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-md text-xs font-medium tracking-normal transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#1A1A18] text-[#F3F1EC]'
                        : 'text-[#6E6B64] hover:text-[#1A1A18] hover:bg-[#E9E6DF]'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 ? (
                    <span className="font-mono text-[10px] px-1.5 py-0.2 bg-[#A63D40] text-white rounded-full font-bold ml-1">
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-[#1A1A18] hover:bg-[#E9E6DF] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[rgba(26,26,24,0.15)] bg-[#F3F1EC] px-4 pt-2 pb-4 space-y-1">
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-[#1A1A18] text-[#F3F1EC]'
                      : 'text-[#6E6B64] hover:bg-[#E9E6DF] hover:text-[#1A1A18]'
                  }`
                }
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="font-mono text-xs px-2 py-0.5 bg-[#A63D40] text-white rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      )}
    </header>
  );
};
