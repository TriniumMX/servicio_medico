'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getRequiredPermission } from '@/lib/routePermissions';

/**
 * RouteGuard — Protección dinámica de rutas basada en permisos.
 *
 * Cómo funciona:
 *  1. Lee el pathname actual
 *  2. Busca el permiso requerido en ROUTE_PERMISSIONS (derivado de menuConfig)
 *  3. Si el usuario NO tiene ese permiso → redirige a /dashboard
 *
 * Rutas sin mapeo en menuConfig → se dejan pasar sin restricción.
 */
export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { hasPermission, user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const lastChecked = useRef<string>('');

  useEffect(() => {
    // Esperar a que auth cargue
    if (loading || !user) return;
    // No re-verificar la misma ruta dos veces seguidas
    if (lastChecked.current === pathname) return;
    lastChecked.current = pathname;

    const required = getRequiredPermission(pathname);
    if (!required) return; // Ruta sin restricción

    if (!hasPermission(required)) {
      console.warn(`🚫 Acceso denegado: ${pathname} requiere "${required}"`);
      router.replace('/dashboard');
    }
  }, [pathname, user, loading]);

  // Mientras auth carga, no renderizar nada (evita flash de contenido)
  if (loading) return null;

  // Si ya cargó y no tiene permiso → no renderizar (la redirección ya se disparó)
  const required = getRequiredPermission(pathname);
  if (user && required && !hasPermission(required)) return null;

  return <>{children}</>;
}
