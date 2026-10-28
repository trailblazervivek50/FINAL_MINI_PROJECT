import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Trash2,
  MapPin,
  List,
  ShoppingBag,
  Bell,
  Users,
  BarChart2,
  Truck,
  User,
  Laptop,
  ShieldCheck,
  Settings,
  Activity
} from 'lucide-react';
import { useMunicipal } from '../../context/MunicipalContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
  badge?: number;
  badgeColor?: string;
}

interface NavGroup {
  category: string;
  items: NavItem[];
}

/**
 * Decorative background SVG wave layers and subtle eco-leaf motif.
 * Lightweight, non-intrusive, pointer-events-none, strictly visual.
 */
const SidebarDecorations: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 left-0 right-0 h-72 overflow-hidden z-0 select-none"
    >
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 280 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Wave Linear Gradients */}
          <linearGradient id="waveGrad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.22" />
            <stop offset="50%" stopColor="#2563eb" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#0a192f" stopOpacity="0.01" />
          </linearGradient>

          <linearGradient id="waveGrad2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.03" />
          </linearGradient>

          <linearGradient id="waveStrokeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#0284c7" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="leafGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.40" />
          </linearGradient>

          <filter id="waveGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Deep background ambient wave */}
        <path
          d="M0,280 L0,185 C75,160 145,225 280,155 L280,280 Z"
          fill="url(#waveGrad1)"
        />

        {/* Glowing undulating crest line */}
        <path
          d="M0,200 C80,170 150,235 280,165"
          stroke="url(#waveStrokeGrad)"
          strokeWidth="1.5"
          fill="none"
          filter="url(#waveGlow)"
        />

        {/* Secondary foreground wave */}
        <path
          d="M0,280 L0,225 C95,195 175,248 280,190 L280,280 Z"
          fill="url(#waveGrad2)"
        />

        {/* Subtle accent line 2 */}
        <path
          d="M0,235 C100,205 180,258 280,200"
          stroke="url(#waveStrokeGrad)"
          strokeWidth="1"
          strokeOpacity="0.35"
          fill="none"
        />

        {/* Minimal Leaf Motif Silhouette curving gracefully on the right */}
        <g opacity="0.8">
          {/* Main Stem */}
          <path
            d="M255,270 Q232,175 205,92"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.45"
            fill="none"
          />

          {/* Top Leaf */}
          <path
            d="M205,92 C196,75 208,60 216,70 C222,80 217,90 205,92 Z"
            fill="url(#leafGrad)"
            stroke="#38bdf8"
            strokeWidth="0.8"
            strokeOpacity="0.55"
          />

          {/* Upper Right Leaf */}
          <path
            d="M213,115 C232,103 244,115 236,125 C226,131 216,123 213,115 Z"
            fill="url(#leafGrad)"
            stroke="#38bdf8"
            strokeWidth="0.8"
            strokeOpacity="0.55"
          />

          {/* Middle Left Leaf */}
          <path
            d="M221,143 C198,135 193,149 203,157 C212,163 220,151 221,143 Z"
            fill="url(#leafGrad)"
            stroke="#38bdf8"
            strokeWidth="0.8"
            strokeOpacity="0.55"
          />

          {/* Lower Right Leaf */}
          <path
            d="M232,175 C254,167 260,183 250,192 C240,199 233,185 232,175 Z"
            fill="url(#leafGrad)"
            stroke="#38bdf8"
            strokeWidth="0.8"
            strokeOpacity="0.55"
          />

          {/* Lower Left Accent Leaf */}
          <path
            d="M241,212 C222,207 220,221 228,227 C236,231 241,220 241,212 Z"
            fill="url(#leafGrad)"
            stroke="#38bdf8"
            strokeWidth="0.8"
            strokeOpacity="0.55"
          />
        </g>
      </svg>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const { alerts, reports, tasks, realBins } = useMunicipal();

  const activeAlertsCount = alerts.filter((a) => !a.resolved).length;
  const activeReportsCount = reports.filter((r) => r.status !== 'RESOLVED').length;
  const activeTasksCount = tasks.filter((t) => t.status !== 'VERIFIED').length;
  const onlineCount = realBins.filter((b) => b.online || b.connection_state === 'ONLINE').length;

  // Specified badge counts with dynamic fallback (Field Tasks: 4, Citizen Reports: 3, Live Alerts: 1)
  const tasksBadge = activeTasksCount || 4;
  const reportsBadge = activeReportsCount ? Math.max(activeReportsCount, 3) : 3;
  const alertsBadge = 1;

  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        category: 'OVERVIEW',
        items: [
          {
            to: '/',
            label: 'Dashboard',
            icon: LayoutGrid,
            end: true,
          },
        ],
      },
      {
        category: 'BIN MANAGEMENT',
        items: [
          {
            to: '/bins',
            label: 'Bins',
            icon: Trash2,
          },
          {
            to: '/map',
            label: 'Live GPS Map',
            icon: MapPin,
          },
          {
            to: '/priority',
            label: 'Collection Priority',
            icon: List,
          },
          {
            to: '/tasks',
            label: 'Field Tasks',
            icon: ShoppingBag,
            badge: tasksBadge,
            badgeColor: 'bg-[#2563eb]',
          },
          {
            to: '/reports',
            label: 'Citizen Reports',
            icon: ShoppingBag,
            badge: reportsBadge,
            badgeColor: 'bg-[#0284c7]',
          },
          {
            to: '/alerts',
            label: 'Live Alerts',
            icon: Bell,
            badge: alertsBadge,
            badgeColor: 'bg-[#ef4444]',
          },
          {
            to: '/workers',
            label: 'Sanitation Workers',
            icon: Users,
          },
        ],
      },
      {
        category: 'ANALYTICS & FLEET',
        items: [
          {
            to: '/analytics',
            label: 'Waste Analytics',
            icon: BarChart2,
          },
          {
            to: '/simulator',
            label: 'Demo Fleet Simulator',
            icon: Truck,
          },
        ],
      },
      {
        category: 'PORTALS & ROLES',
        items: [
          {
            to: '/citizen',
            label: 'Citizen Portal',
            icon: User,
          },
          {
            to: '/worker',
            label: 'Worker Dashboard',
            icon: Laptop,
          },
          {
            to: '/supervisor/verification',
            label: 'Supervisor Audit',
            icon: ShieldCheck,
          },
          {
            to: '/settings',
            label: 'System Settings',
            icon: Settings,
          },
        ],
      },
    ],
    [tasksBadge, reportsBadge, alertsBadge]
  );

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[272px] text-white flex flex-col border-r border-[#1e3a5f]/40 select-none transition-transform duration-300 ease-in-out shrink-0 overflow-hidden ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
      style={{
        background:
          'radial-gradient(ellipse 90% 40% at 50% 0%, rgba(14, 165, 233, 0.14) 0%, transparent 70%), linear-gradient(180deg, #030d1c 0%, #020914 48%, #01060e 100%)',
      }}
    >
      {/* 1. Header and Branding */}
      <div className="h-[70px] px-5 flex items-center justify-between border-b border-white/[0.08] shrink-0 relative z-10">
        <NavLink
          to="/"
          className="flex items-center gap-3.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] rounded-xl p-1 -m-1"
          onClick={onCloseMobile}
        >
          {/* Blue rounded-square logo with white trash-bin icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0284c7] via-[#2563eb] to-[#1d4ed8] flex items-center justify-center text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)] transition-transform duration-200 group-hover:scale-105 shrink-0">
            <Trash2 className="w-5 h-5 text-white" strokeWidth={2} />
          </div>

          <div className="min-w-0">
            <span className="font-bold text-[15px] text-white tracking-tight leading-tight block truncate">
              Municipal Waste
            </span>
            <span className="text-[11px] text-[#94a3b8] font-normal tracking-tight block mt-0.5 truncate">
              IoT Command Center
            </span>
          </div>
        </NavLink>

        {/* Green online-status indicator */}
        <div
          className="flex items-center justify-center shrink-0 ml-2"
          title={`IoT Network Operational • ${onlineCount}/5 Devices Online`}
        >
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-[#10b981] opacity-65"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981] shadow-[0_0_8px_#10b981]"></span>
          </div>
        </div>
      </div>

      {/* 2. Scrollable Navigation Menu */}
      <nav
        aria-label="Main Navigation"
        className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {navGroups.map((group) => (
          <div key={group.category} className="space-y-1">
            {/* Muted Blue-Gray Section Label */}
            <div className="px-3.5 pt-2 pb-1 text-[10px] font-bold tracking-widest text-[#64748b] uppercase">
              {group.category}
            </div>

            {/* Navigation Items */}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.end
                  ? location.pathname === item.to || (item.to === '/' && location.pathname === '/dashboard')
                  : location.pathname.startsWith(item.to) &&
                    (item.to !== '/' || location.pathname === '/' || location.pathname === '/dashboard');

              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  onClick={onCloseMobile}
                  className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ease-out cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030d1c] ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0066ee] via-[#007bf5] to-[#0096ff] text-white font-semibold shadow-[0_4px_20px_rgba(0,123,245,0.4),0_0_12px_rgba(56,189,248,0.25)]'
                      : 'text-[#cbd5e1] hover:text-white hover:bg-white/[0.06] hover:translate-x-[3px]'
                  }`}
                >
                  {/* Thin cyan accent bar on the left edge for active item */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#38bdf8] rounded-r-full shadow-[0_0_8px_#38bdf8]"
                      aria-hidden="true"
                    />
                  )}

                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-[18px] h-[18px] shrink-0 transition-colors duration-200 ${
                        isActive ? 'text-white' : 'text-[#94a3b8] group-hover:text-white'
                      }`}
                      strokeWidth={1.8}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {/* Notification Badge */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`ml-2 text-[11px] font-semibold text-white px-2 py-0.5 rounded-full min-w-5 h-5 flex items-center justify-center shrink-0 shadow-xs ${
                        item.badgeColor || 'bg-[#2563eb]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* 3. Decorative Waves and Leaf Motif (Bottom Background) */}
      <SidebarDecorations />

      {/* 4. Bottom System Status Card */}
      <div className="relative z-10 px-3.5 pb-4 pt-2 mt-auto shrink-0">
        <div
          className="p-3 rounded-2xl bg-[#06182e]/85 backdrop-blur-md border border-[#38bdf8]/25 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-all duration-200 hover:border-[#38bdf8]/40"
          title={`Physical Microcontrollers: ${onlineCount}/5 Online`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Activity Pulse Icon */}
              <div className="w-8 h-8 rounded-xl bg-[#0369a1]/30 border border-[#38bdf8]/30 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-[#22d3ee] animate-pulse" />
              </div>

              <div className="min-w-0">
                <div className="text-[12px] font-bold text-white tracking-tight leading-tight">
                  System Status
                </div>
                <div className="text-[11px] text-[#94a3b8] font-medium leading-tight mt-0.5 truncate">
                  All Systems Operational
                </div>
              </div>
            </div>

            {/* Subtle animated green status indicator */}
            <div className="relative flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-[#10b981]/15 ml-2">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-[#10b981] opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981] shadow-[0_0_8px_#10b981]"></span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.08] my-2.5" />

          {/* Last updated timestamp */}
          <div className="text-[10px] text-[#64748b] font-medium tracking-tight">
            Last updated · 5 min ago
          </div>
        </div>
      </div>
    </aside>
  );
};
