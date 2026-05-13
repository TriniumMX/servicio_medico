/**
 * routePermissions.ts
 *
 * Aplana el menuConfig en un mapa { ruta: permisoRequerido }.
 * Se usa en RouteGuard para verificar acceso dinámicamente.
 *
 * Si una ruta no aparece en este mapa → se deja pasar (sin restricción).
 */

import { menuItems } from '@/components/layout/menuConfig';

type RoutePermissionMap = Record<string, string>;

function buildRoutePermissionsMap(): RoutePermissionMap {
  const map: RoutePermissionMap = {};

  for (const item of menuItems) {
    // Solo rutas reales dentro de /dashboard
    if (item.path.startsWith('/dashboard') && item.action) {
      map[item.path] = item.action;
    }

    if (item.subItems) {
      for (const sub of item.subItems) {
        if (sub.path.startsWith('/dashboard') && sub.action) {
          map[sub.path] = sub.action;
        }
      }
    }
  }

  return map;
}

export const ROUTE_PERMISSIONS = buildRoutePermissionsMap();

/**
 * Dado un pathname, busca el permiso requerido usando el prefijo más específico.
 * Ej: '/dashboard/coordinacion/laboratorio/123' → GESTIONAR_ORDENES_LAB
 */
export function getRequiredPermission(pathname: string): string | null {
  // Coincidencia exacta primero
  if (ROUTE_PERMISSIONS[pathname]) return ROUTE_PERMISSIONS[pathname];

  // Si no, prefijo más largo que coincida
  const match = Object.entries(ROUTE_PERMISSIONS)
    .filter(([route]) => pathname.startsWith(route + '/'))
    .sort((a, b) => b[0].length - a[0].length)[0];

  return match ? match[1] : null;
}
