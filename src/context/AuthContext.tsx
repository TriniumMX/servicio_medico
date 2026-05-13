// src/context/AuthContext.tsx

'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

interface User {
  id_usuario: number;
  nombre: string;
  username: string;
  id_tipousuario: number;
  firma_digital?: string; // Base64 image
  id_hospital?: number | null;
  nombre_hospital?: string | null;
}

interface AuthContextType {
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;
  login: (user: User, permissions: string[]) => void;
  logout: () => void;
  loading: boolean;
  hasPermission: (action?: string) => boolean;
  updateFirmaDigital: (firma: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  // Inicializamos siempre como array vacío []
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          // CORRECCIÓN: Aseguramos que siempre sea un array, si viene null/undefined ponemos []
          setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
        } else {
          setUser(null);
          setPermissions([]);
        }
      } catch (error) {
        console.error('Error al verificar la sesión:', error);
        setUser(null);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = (userData: User, userPermissions: string[]) => {
    setLoading(true);
    setUser(userData);
    // CORRECCIÓN: Aseguramos que no entre undefined
    setPermissions(Array.isArray(userPermissions) ? userPermissions : []);
    setLoading(false);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error durante el logout:', error);
    } finally {
      setUser(null);
      setPermissions([]);
    }
  };

  const updateFirmaDigital = (firma: string) => {
    if (user) {
      setUser({ ...user, firma_digital: firma });
    }
  };

  // --- AQUÍ ESTABA EL ERROR ---
  const hasPermission = useCallback((action?: string) => {
    // 1. Si no requiere acción, pase.
    if (!action) return true;

    // 2. Si no hay usuario, bloqueado.
    if (!user) return false;

    // 3. CORRECCIÓN: Verificamos que permissions exista y sea un array antes de usar .includes

    if (user.id_tipousuario === 6) {
      return true;
    }

    if (!Array.isArray(permissions)) return false;

    return permissions.includes(action);
  }, [user, permissions]);

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions, // Exportamos permissions por si acaso
        isAuthenticated: !!user,
        login,
        logout,
        loading,
        hasPermission,
        updateFirmaDigital
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