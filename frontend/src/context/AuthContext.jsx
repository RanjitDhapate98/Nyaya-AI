import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { tokenStore } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let active = true;
    if (!tokenStore.get()) { setInitializing(false); return undefined; }
    authService.me()
      .then(({ user: u }) => { if (active) setUser(u); })
      .catch(() => tokenStore.clear())
      .finally(() => { if (active) setInitializing(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const onExpired = (e) => {
      setUser(null);
      toast.error(e.detail || 'Your session has expired. Please log in again.');
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = useCallback(async (credentials) => {
    const { user: u, token } = await authService.login(credentials);
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: u, token } = await authService.register(payload);
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* token may already be invalid */ }
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    initializing,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    hasRole: (...roles) => Boolean(user && roles.includes(user.role)),
    canEdit: Boolean(user && ['admin', 'analyst'].includes(user.role)),
  }), [user, initializing, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
