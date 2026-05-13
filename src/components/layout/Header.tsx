'use client';

import { Sun, Moon, Search, Menu, Building2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/context/SidebarContext';
import NotificationBell from '@/components/layout/NotificationBell';

export default function Header() {
  const { user } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { toggleSidebar } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  const switchTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`relative flex items-center justify-between px-4 md:px-6 py-3 md:py-4 h-16 md:h-20 shrink-0 shadow-sm backdrop-blur-sm transition-all duration-300 ${
        isDark 
          ? 'bg-[#0a1929]/95 border-b border-[#0f83b2]/20' 
          : 'bg-white/95 border-b border-gray-200'
      }`}
    >
      {/* Left Side - Mobile Menu + Welcome */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile Menu Button */}
        <motion.button
          onClick={toggleSidebar}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`md:hidden p-2 md:p-2.5 rounded-xl transition-all duration-300 ${
            isDark
              ? 'bg-[#0f83b2]/10 hover:bg-[#0f83b2]/20 text-gray-300 hover:text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-[#2dafdc]`}
        >
          <Menu className="h-5 w-5 md:h-6 md:w-6" />
        </motion.button>

        {/* Welcome Message */}
        <div className="min-w-0 flex-1">
          {/* Desktop Version */}
          <h1 className={`hidden md:block text-base lg:text-lg font-bold transition-colors duration-300 truncate ${
            isDark ? 'text-white' : 'text-gray-800'
          }`}>
            Bienvenido, <span className="text-[#2dafdc]">{user?.nombre}</span>
          </h1>
          <div className={`hidden md:flex items-center gap-3 text-xs transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <span>
              {new Date().toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            {user?.nombre_hospital && (
              <>
                <span className={`w-px h-3 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {user.nombre_hospital}
                </span>
              </>
            )}
          </div>

          {/* Mobile Version */}
          <div className="md:hidden">
            <h1 className={`text-xl font-bold tracking-wide transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              PAND<span className="text-[#0db1ec]">O</span>RA
            </h1>
            <p className={`text-xs transition-colors duration-300 truncate ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {user?.nombre}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Search Button */}
        <motion.button
          onClick={() => setShowSearch(!showSearch)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`p-2 md:p-2.5 rounded-xl transition-all duration-300 ${
            isDark
              ? 'bg-[#0f83b2]/10 hover:bg-[#0f83b2]/20 text-gray-300 hover:text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-[#2dafdc]`}
        >
          <Search className="h-4 w-4 md:h-5 md:w-5" />
        </motion.button>

        {/* Notifications Button */}
        <NotificationBell />

        {/* Theme Toggle Button */}
        <motion.button
          onClick={switchTheme}
          whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          className={`p-2 md:p-2.5 rounded-xl transition-all duration-300 ${
            isDark
              ? 'bg-gradient-to-br from-[#0f83b2] to-[#2dafdc] text-white shadow-lg shadow-[#0f83b2]/30'
              : 'bg-gradient-to-br from-[#0f83b2] to-[#2dafdc] text-white shadow-lg shadow-[#0f83b2]/20'
          } focus:outline-none focus:ring-2 focus:ring-[#2fcbaf]`}
        >
          {mounted && (resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4 md:h-5 md:w-5" />
          ) : (
            <Moon className="h-4 w-4 md:h-5 md:w-5" />
          ))}
        </motion.button>
      </div>

      {/* Search Bar Overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-full left-0 right-0 mt-2 mx-3 md:mx-6 p-3 md:p-4 rounded-2xl shadow-2xl backdrop-blur-md z-50 ${
              isDark ? 'bg-[#0a1929]/95 border border-[#0f83b2]/20' : 'bg-white/95 border border-gray-200'
            }`}
          >
            <input
              type="text"
              placeholder="Buscar en el sistema..."
              autoFocus
              className={`w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-sm md:text-base transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#2dafdc] ${
                isDark 
                  ? 'bg-[#0f83b2]/10 text-white placeholder-gray-400' 
                  : 'bg-gray-100 text-gray-900 placeholder-gray-500'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
