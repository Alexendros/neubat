import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [settledPath, setSettledPath] = useState<string | null>(null);
  const loading = location.pathname !== '/' && settledPath !== location.pathname;

  const refresh = useCallback(async () => {
    try {
      const data = await api.me();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setSettledPath(window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (location.pathname === '/') return;
    let cancelled = false;
    const path = location.pathname;
    api
      .me()
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setSettledPath(path);
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* Sin portal la cookie no se puede revocar; la UI deja de mostrar sesión. */
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, logout }),
    [user, loading, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth requiere AuthProvider');
  return ctx;
}
