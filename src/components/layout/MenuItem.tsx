// src/components/layout/MenuItem.tsx

'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, ChevronDown } from 'lucide-react';
import { useLoading } from '@/context/LoadingContext';

// ... (imports remain)

interface SubItem {
  name: string;
  path: string;
}

interface MenuItemProps {
  name: string;
  icon: LucideIcon;
  path: string;
  subItems?: SubItem[];
  index: number;
  isSidebarOpen: boolean;
  isDark: boolean;
  onSubItemClick?: () => void;
  isPulsating?: boolean;
}

export default function MenuItem({
  name,
  icon: Icon,
  path,
  subItems,
  index,
  isSidebarOpen,
  isDark,
  onSubItemClick,
  isPulsating
}: MenuItemProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setIsLoading } = useLoading();

  const hasSubItems = subItems && subItems.length > 0;

  // Verificar si algún subitem está activo
  const isSubItemActive = subItems?.some(item => pathname.startsWith(item.path));

  // El item principal está activo si:
  // 1. La ruta exacta coincide, O
  // 2. Algún subitem está activo
  const isActive = pathname === path || isSubItemActive || false;

  // Estado del submenú: abierto si hay un subitem activo
  const [isOpen, setIsOpen] = useState(false);

  // Abrir automáticamente si hay un subitem activo
  useEffect(() => {
    if (isSubItemActive) {
      setIsOpen(true);
    }
  }, [isSubItemActive]);

  const handleClick = () => {
    if (hasSubItems) {
      setIsOpen(!isOpen);
    } else {
      // Mostrar loader y navegar
      setIsLoading(true);
      router.push(path);
      onSubItemClick?.();
      // El loader se ocultará cuando la página cargue
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const handleSubItemClick = (subPath: string) => {
    // Mostrar loader y navegar
    setIsLoading(true);
    router.push(subPath);
    onSubItemClick?.();
    // El loader se ocultará cuando la página cargue
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className="relative">
      {/* Micro Indicador Verde */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#2fcbaf] rounded-r-full"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}

      <motion.button
        onClick={handleClick}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-300 ${isPulsating
            ? 'bg-gradient-to-r from-orange-500 to-red-600 !text-white animate-pulse shadow-lg shadow-orange-500/50'
            : isActive
              ? isDark
                ? 'bg-[#0db1ec] text-white shadow-lg shadow-[#0db1ec]/20'
                : 'bg-[#0db1ec] text-white shadow-lg shadow-[#0db1ec]/20'
              : isDark
                ? 'text-gray-300 hover:bg-[#0f83b2]/10 hover:text-white'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon className={`h-5 w-5 shrink-0 ${isActive || isPulsating ? 'text-white' : ''}`} />
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="whitespace-nowrap overflow-hidden"
              >
                {name}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {hasSubItems && isSidebarOpen && (
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        )}
      </motion.button>

      {/* Submenú */}
      {hasSubItems && (
        <AnimatePresence>
          {isOpen && isSidebarOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-[#0db1ec]/20 pl-4">
                {subItems.map((subItem) => {
                  const isSubActive = pathname.startsWith(subItem.path);

                  return (
                    <motion.button
                      key={subItem.path}
                      onClick={() => handleSubItemClick(subItem.path)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${isSubActive
                        ? isDark
                          ? 'bg-[#0db1ec]/20 text-[#0db1ec] border-l-2 border-[#0db1ec]'
                          : 'bg-[#0db1ec]/10 text-[#0db1ec] border-l-2 border-[#0db1ec]'
                        : isDark
                          ? 'text-gray-400 hover:bg-[#0f83b2]/10 hover:text-gray-300'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                      {subItem.name}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}