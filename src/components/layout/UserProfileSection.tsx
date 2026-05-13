// src/components/layout/UserProfileSection.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface User {
  nombre?: string;
  username?: string;
}

interface UserProfileSectionProps {
  user: User | null;
  isSidebarOpen: boolean;
  isDark: boolean;
  isMobile?: boolean;
}

export default function UserProfileSection({ 
  user, 
  isSidebarOpen, 
  isDark,
  isMobile = false 
}: UserProfileSectionProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        router.push('/login');
      } else {
        console.error('Error al cerrar sesión');
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Error en logout:', error);
      setIsLoggingOut(false);
    }
  };

  // Obtener iniciales del nombre
  const getInitials = () => {
    if (!user?.nombre) return 'UN';
    const names = user.nombre.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.nombre.substring(0, 2).toUpperCase();
  };

  return (
    <div className={`p-4 border-t shrink-0 transition-colors duration-300 ${
      isDark ? 'border-[#0f83b2]/20 bg-[#0a1929]/50' : 'border-gray-200 bg-gray-50/50'
    }`}>
      {/* Perfil de Usuario */}
      <motion.div 
        className={`flex items-center ${
          isSidebarOpen ? 'p-3' : 'p-2 justify-center'
        } rounded-xl transition-all duration-300 ${
          isDark 
            ? isMobile ? 'bg-[#0f83b2]/10' : 'hover:bg-[#0f83b2]/10' 
            : isMobile ? 'bg-white' : 'hover:bg-white'
        } ${isMobile ? 'mb-3' : ''}`}
        whileHover={!isMobile ? { scale: 1.02 } : undefined}
      >
        <div className="relative flex-shrink-0">
          <img
            src={`https://ui-avatars.com/api/?name=${getInitials()}&background=0f83b2&color=fff&bold=true`}
            alt="Avatar"
            className="h-10 w-10 rounded-xl border-2 border-[#2dafdc] shadow-md"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#2fcbaf] border-2 border-white dark:border-[#0a1929] rounded-full"></div>
        </div>
        
        <AnimatePresence>
          {(isSidebarOpen || isMobile) && (
            <motion.div
              initial={!isMobile ? { opacity: 0, width: 0 } : undefined}
              animate={!isMobile ? { opacity: 1, width: 'auto' } : undefined}
              exit={!isMobile ? { opacity: 0, width: 0 } : undefined}
              transition={!isMobile ? { duration: 0.3, ease: [0.4, 0, 0.2, 1] } : undefined}
              className="ml-3 overflow-hidden flex-1 min-w-0"
            >
              <p className={`${isMobile ? 'font-bold' : 'font-semibold'} text-sm whitespace-nowrap truncate transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>
                {user?.nombre}
              </p>
              <p className={`text-xs text-[#2dafdc] whitespace-nowrap truncate ${isMobile ? 'font-medium' : ''}`}>
                {user?.username}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Botón de Logout */}
      <motion.button
        onClick={handleLogout}
        disabled={isLoggingOut}
        whileHover={!isMobile ? { scale: 1.02 } : undefined}
        whileTap={{ scale: 0.95 }}
        title={!isSidebarOpen && !isMobile ? 'Cerrar Sesión' : undefined}
        className={`w-full mt-3 flex items-center ${
          isSidebarOpen || isMobile ? 'justify-center' : 'justify-center'
        } ${
          isSidebarOpen || isMobile ? 'p-3' : 'p-2.5'
        } rounded-xl ${isMobile ? 'font-bold text-base' : 'font-medium'} transition-all duration-300 ${
          isDark
            ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300'
            : 'bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700'
        } shadow-sm hover:shadow-md ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <LogOut className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} shrink-0`} />
        <AnimatePresence>
          {(isSidebarOpen || isMobile) && (
            <motion.span
              initial={!isMobile ? { opacity: 0, width: 0 } : undefined}
              animate={!isMobile ? { opacity: 1, width: 'auto' } : undefined}
              exit={!isMobile ? { opacity: 0, width: 0 } : undefined}
              transition={!isMobile ? { duration: 0.3, ease: [0.4, 0, 0.2, 1] } : undefined}
              className="ml-3 whitespace-nowrap overflow-hidden"
            >
              {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}