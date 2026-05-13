'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface TenantConfig {
  colorPrimario: string;
  colorSecundario: string;
  logoUrl: string | null;
  nombreOrganizacion: string;
}

const DEFAULTS: TenantConfig = {
  colorPrimario: '#0EA5E9',
  colorSecundario: '#7C3AED',
  logoUrl: null,
  nombreOrganizacion: 'Trinium Médico',
};

const TenantContext = createContext<TenantConfig>(DEFAULTS);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const config: TenantConfig = user
    ? {
        colorPrimario: user.colorPrimario ?? DEFAULTS.colorPrimario,
        colorSecundario: user.colorSecundario ?? DEFAULTS.colorSecundario,
        logoUrl: user.logoUrl ?? null,
        nombreOrganizacion: user.nombre_organizacion,
      }
    : DEFAULTS;

  useEffect(() => {
    document.documentElement.style.setProperty('--color-brand-primary', config.colorPrimario);
    document.documentElement.style.setProperty('--color-brand-secondary', config.colorSecundario);
  }, [config.colorPrimario, config.colorSecundario]);

  return (
    <TenantContext.Provider value={config}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);
