'use client';

import { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import Loader from '@/components/Loader';
import { NotificationsProvider } from '@/context/NotificationsContext';
import NotificationToast from '@/components/NotificationToast';
import GlobalNotificationListener from '@/components/GlobalNotificationListener';
import AudioPermissionHelper from '@/components/AudioPermissionHelper';
import { SidebarContext } from '@/context/SidebarContext';
import { LoadingContext } from '@/context/LoadingContext';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <NotificationsProvider>
      <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
        <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar }}>
          <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${isDark
            ? 'bg-[#0d2137] text-gray-100'
            : 'bg-[#f8f9fa] text-gray-800'
            }`}>
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <Header />

              {/* Main Content with Animation */}
              <motion.main
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={`flex-1 overflow-x-hidden overflow-y-auto transition-colors duration-300 p-4 sm:p-6 lg:p-8 ${isDark
                    ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100'
                    : 'bg-slate-50 text-gray-800'
                  }`}
              >
                {children}
              </motion.main>
            </div>
          </div>

          {/* Overlay para móviles cuando el sidebar está abierto */}
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            />
          )}

          {/* Global Loader */}
          <AnimatePresence>
            {isLoading && (
              <>
                {/* Overlay con blur */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
                />

                {/* Loader centrado */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="fixed inset-0 flex items-center justify-center z-[10000] pointer-events-none"
                >
                  <div className={`p-8 rounded-2xl shadow-2xl pointer-events-auto ${isDark ? 'bg-[#0a1929]/95' : 'bg-white/95'
                    } backdrop-blur-sm border ${isDark ? 'border-[#0f83b2]/20' : 'border-gray-200'
                    }`}>
                    <Loader text="Cargando..." size="md" />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Notification Toasts */}
          <NotificationToast />

          {/* Global Notification Listener (con verificación de permisos) */}
          <GlobalNotificationListener />

          {/* Audio Permission Helper (desbloquear audio en navegadores) */}
          <AudioPermissionHelper />
        </SidebarContext.Provider>
      </LoadingContext.Provider>
    </NotificationsProvider>
  );
}
