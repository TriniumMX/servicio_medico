'use client';

import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { useTheme } from 'next-themes';
import { useEffect, useState, useMemo } from 'react';
import MenuItem from './MenuItem';
import UserProfileSection from './UserProfileSection';
// IMPORTANTE: Importamos la configuración externa
import { menuItems } from './menuConfig';

export default function Sidebar() {
  const { user, hasPermission } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === 'dark';

  // LÓGICA DE FILTRADO DE MENÚ
  const filteredMenu = useMemo(() => {
    if (!user) return [];

    return menuItems
      .map((item) => {
        // 1. Verificar permiso del padre
        if (item.action && !hasPermission(item.action)) {
          return null;
        }

        // 2. Filtrar hijos
        if (item.subItems) {
          const filteredSubItems = item.subItems.filter(
            (subItem: any) => !subItem.action || hasPermission(subItem.action)
          );
          return { ...item, subItems: filteredSubItems };
        }

        return item;
      })
      .filter(Boolean);
  }, [user, hasPermission]);

  return (
    <>
      {/* Sidebar Desktop */}
      <motion.aside
        animate={{
          width: isSidebarOpen ? '240px' : '70px',
          x: 0
        }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className={`hidden md:flex relative flex-col h-full shadow-xl transition-colors duration-300 ${isDark
            ? 'bg-gradient-to-b from-[#0a1929] to-[#0d2137]'
            : 'bg-gradient-to-b from-white to-[#fafbfc]'
          }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-3 py-4 border-b h-20 shrink-0 transition-colors duration-300 ${isDark ? 'border-[#0f83b2]/20' : 'border-gray-200'
          }`}>
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center flex-1"
              >
                <h1 className={`text-2xl font-bold tracking-wide transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                  PAND<span className="text-[#0db1ec]">O</span>RA
                </h1>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={toggleSidebar}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-2.5 rounded-xl transition-all duration-300 ${isDark
                ? 'bg-[#0f83b2]/10 hover:bg-[#0f83b2]/20 text-gray-300 hover:text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
              }`}
          >
            <Menu className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {filteredMenu.map((item: any, index: number) => (
            <MenuItem
              key={item.name}
              {...item}
              index={index}
              isSidebarOpen={isSidebarOpen}
              isDark={isDark}
              isPulsating={user?.username === 'm_padilla' && item.name === 'Análisis de datos'}
            />
          ))}
        </nav>

        {/* User Profile */}
        <UserProfileSection
          user={user}
          isSidebarOpen={isSidebarOpen}
          isDark={isDark}
        />
      </motion.aside>

      {/* Sidebar Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`md:hidden fixed top-0 left-0 bottom-0 w-72 z-50 flex flex-col shadow-2xl ${isDark
                  ? 'bg-gradient-to-b from-[#0a1929] to-[#0d2137]'
                  : 'bg-gradient-to-b from-white to-[#fafbfc]'
                }`}
            >
              {/* Header Mobile */}
              <div className={`flex items-center justify-between px-5 py-4 border-b transition-colors duration-300 ${isDark ? 'border-[#0f83b2]/20' : 'border-gray-200'
                }`}>
                <h1 className={`text-2xl font-bold tracking-wide transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                  PAND<span className="text-[#0db1ec]">O</span>RA
                </h1>
                <motion.button
                  onClick={toggleSidebar}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2 rounded-xl transition-all duration-300 ${isDark
                      ? 'bg-[#0f83b2]/10 hover:bg-[#0f83b2]/20 text-gray-300 hover:text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <X className="h-6 w-6" />
                </motion.button>
              </div>

              {/* Navigation Mobile */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                {filteredMenu.map((item: any, index: number) => (
                  <MenuItem
                    key={item.name}
                    {...item}
                    index={index}
                    isSidebarOpen={true}
                    isDark={isDark}
                    onSubItemClick={toggleSidebar}
                    isPulsating={user?.username === 'm_padilla' && item.name === 'Análisis de datos'}
                  />
                ))}
              </nav>

              {/* User Profile Mobile */}
              <UserProfileSection
                user={user}
                isSidebarOpen={true}
                isDark={isDark}
                isMobile={true}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}