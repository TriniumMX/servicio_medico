// src/components/Loader.tsx
'use client';

import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface LoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Loader({ text = 'Cargando...', size = 'md' }: LoaderProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === 'dark';

  const sizes = {
    sm: { logo: 'w-16 h-16', text: 'text-sm' },
    md: { logo: 'w-24 h-24', text: 'text-base' },
    lg: { logo: 'w-32 h-32', text: 'text-lg' }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Logo con efecto minimalista */}
      <div className={`relative ${sizes[size].logo}`}>
        {/* Resplandor de fondo */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0f83b2] to-[#2dafdc] blur-2xl"
        />

        {/* Logo */}
        <motion.div
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`relative ${sizes[size].logo} rounded-2xl overflow-hidden ${
            isDark ? 'bg-[#0a1929]' : 'bg-white'
          } p-3 shadow-2xl border-2 ${
            isDark ? 'border-[#0f83b2]/20' : 'border-gray-100'
          }`}
        >
          <img
            src="/logo_pandora.png"
            alt="PANDORA"
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = `<div class="w-full h-full flex items-center justify-center">
                  <span class="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0f83b2] to-[#0db1ec]">P</span>
                </div>`;
              }
            }}
          />
        </motion.div>

        {/* Barra de progreso debajo del logo */}
        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-1 rounded-full overflow-hidden ${
          isDark ? 'bg-[#0f83b2]/20' : 'bg-gray-200'
        }`}>
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="h-full w-1/2 bg-gradient-to-r from-transparent via-[#0db1ec] to-transparent"
          />
        </div>
      </div>

      {/* Texto de carga */}
      <motion.div
        animate={{
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="flex flex-col items-center gap-3"
      >
        <p className={`${sizes[size].text} font-bold transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {text}
        </p>
        
        {/* Puntos animados minimalistas */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
              className="w-2 h-2 rounded-full bg-[#0db1ec]"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Loader de pantalla completa
export function FullScreenLoader({ text }: { text?: string }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === 'dark';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-[#0a1929] via-[#0d2137] to-[#0a1929]' 
        : 'bg-gradient-to-br from-white via-gray-50 to-white'
    }`}>
      <Loader text={text} size="lg" />
    </div>
  );
}