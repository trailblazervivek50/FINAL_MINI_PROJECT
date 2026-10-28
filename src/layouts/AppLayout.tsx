import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '../components/navigation/Sidebar';
import { TopBar } from '../components/navigation/TopBar';
import { Trash2 } from 'lucide-react';
import { pageVariants } from '../utils/motion';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F0F5FB] text-[#14283F] font-sans antialiased">
      {/* 1. Deep Navy-Blue Navigation Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-[#0C223A]/60 z-40 lg:hidden backdrop-blur-2xs transition-opacity"
        />
      )}

      {/* 2. Main Application Canvas */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navigation Bar */}
        <TopBar onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        {/* Content View Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Municipal System Footer */}
        <footer className="border-t border-[#DCE6F0] bg-white py-4 px-6 text-xs text-[#526985]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#1687D9] flex items-center justify-center text-white shadow-xs">
                <Trash2 className="w-3 h-3" />
              </div>
              <span className="font-bold text-[#14283F]">
                Smart Municipal Dustbin Monitoring Platform
              </span>
              <span>&bull;</span>
              <span className="text-[#8192A8]">Civic IoT Command Center</span>
            </div>

            <div className="flex items-center gap-4 text-[#8192A8] font-mono text-[11px]">
              <span>Arduino UNO + ESP8266 + HC-SR04</span>
              <span>&bull;</span>
              <span className="text-[#1687D9] font-semibold">PostgreSQL &amp; Leaflet GIS</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
