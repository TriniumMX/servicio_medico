'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import type { RoleUsuario } from '@/db/schema/usuarios';

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellidoPaterno?: string | null;
  role: RoleUsuario;
  tenant_id: string;
  nombre_organizacion: string;
  colorPrimario?: string | null;
  colorSecundario?: string | null;
  logoUrl?: string | null;
}

const ADMIN_ROLES: RoleUsuario[] = ['super_admin', 'admin_org'];

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  loading: boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  hasRole: (role: RoleUsuario) => boolean;
  // Migration shim: returns true for all authenticated users.
  // Replace with role-based checks in Phase 3+.
  hasPermission: (action?: string) => boolean;
  permissions: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setUser(null);
    }
  };

  const isAdmin = useCallback(() =>
    !!user && ADMIN_ROLES.includes(user.role), [user]);

  const isSuperAdmin = useCallback(() =>
    !!user && user.role === 'super_admin', [user]);

  const hasRole = useCallback((role: RoleUsuario) =>
    !!user && user.role === role, [user]);

  // Shim: any authenticated user passes. Tighten per-role in Phase 3+.
  const hasPermission = useCallback((_action?: string) => !!user, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        loading,
        isAdmin,
        isSuperAdmin,
        hasRole,
        hasPermission,
        permissions: [],
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
