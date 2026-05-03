import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('staffmed_token');
    const stored = localStorage.getItem('staffmed_user');
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('staffmed_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('staffmed_token', data.token);
    localStorage.setItem('staffmed_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const googleLogin = useCallback(async (credential) => {
    const { data } = await authAPI.googleLogin(credential);
    localStorage.setItem('staffmed_token', data.token);
    localStorage.setItem('staffmed_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('staffmed_token', data.token);
    localStorage.setItem('staffmed_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('staffmed_token');
    localStorage.removeItem('staffmed_user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authAPI.me();
      setUser(data);
      localStorage.setItem('staffmed_user', JSON.stringify(data));
    } catch {
      logout();
    }
  }, [logout]);

  const completeOnboarding = useCallback(async (data) => {
    const { data: updated } = await authAPI.completeOnboarding(data);
    setUser(updated);
    localStorage.setItem('staffmed_user', JSON.stringify(updated));
    return updated;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, refreshUser, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
