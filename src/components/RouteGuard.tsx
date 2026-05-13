'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getRequiredPermission } from '@/lib/routePermissions';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { hasPermission, isSuperAdmin, user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const lastChecked = useRef<string>('');

  useEffect(() => {
    if (loading || !user) return;
    if (lastChecked.current === pathname) return;
    lastChecked.current = pathname;

    // /trinium-admin is super_admin only (middleware also enforces this)
    if (pathname.startsWith('/trinium-admin') && !isSuperAdmin()) {
      router.replace('/dashboard');
      return;
    }

    const required = getRequiredPermission(pathname);
    if (!required) return;

    if (!hasPermission(required)) {
      console.warn(`Acceso denegado: ${pathname} requiere "${required}"`);
      router.replace('/dashboard');
    }
  }, [pathname, user, loading]);

  if (loading) return null;

  if (pathname.startsWith('/trinium-admin') && user && !isSuperAdmin()) return null;

  const required = getRequiredPermission(pathname);
  if (user && required && !hasPermission(required)) return null;

  return <>{children}</>;
}
