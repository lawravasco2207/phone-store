import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, API_BASE_URL, type User } from '../utils/api';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get user from session on mount
    const checkAuth = async () => {
      try {
        // Simple auth check - if we have a JWT cookie, try to make an authenticated request
  const response = await fetch(`${API_BASE_URL}/auth/me`, { 
          credentials: 'include' 
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setUser(data.data);
          }
        }
      } catch (error) {
        console.debug('Auth check failed:', error);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    if (response.success && response.data?.user) {
      setUser(response.data.user);
      return { success: true };
    }
    return { success: false, error: response.error || 'Login failed' };
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await api.register(name, email, password);
    if (response.success) {
      return { success: true };
    }
    return { success: false, error: response.error || 'Registration failed' };
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  const value: AuthContextValue = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
