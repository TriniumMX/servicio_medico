// src/components/Logo.tsx
'use client';

import { useState, useEffect } from 'react';

interface LogoProps {
  size?: number;
  isDark?: boolean;
}

export default function Logo({ size = 112, isDark = false }: LogoProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new window.Image();
    img.src = '/logo_pandora.png';
    
    img.onload = () => {
      setIsLoaded(true);
      setHasError(false);
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoaded(true);
    };
  }, []);

  if (!isLoaded) {
    return (
      <div 
        className="flex items-center justify-center animate-pulse"
        style={{ width: size, height: size }}
      >
        <div className="w-20 h-20 bg-gradient-to-br from-[#0f83b2] to-[#0db1ec] rounded-2xl opacity-20" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div 
        className="flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0f83b2] to-[#0db1ec]">
          P
        </span>
      </div>
    );
  }

  return (
    <img
      src="/logo_pandora.png"
      alt="PANDORA Logo"
      width={size}
      height={size}
      className="object-contain"
      style={{ width: size, height: size }}
      loading="eager"
    />
  );
}