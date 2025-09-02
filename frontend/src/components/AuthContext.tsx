import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, API_BASE_URL, type User } from '../utils/api';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  token?: string; // Add token to context
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | undefined>(undefined);

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
            
            // Try to get token from cookie if it exists
            const tokenMatch = document.cookie.match(/(?:^|; )token=([^;]+)/);
            if (tokenMatch) {
              setToken(decodeURIComponent(tokenMatch[1]));
            }
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
      
      // If token was returned in the response, store it as a cookie
      // This helps with cross-origin auth if the cookie from the server isn't accessible
      if (response.data.token) {
        const isSecure = window.location.protocol === 'https:';
        document.cookie = `token=${response.data.token}; Path=/; Max-Age=${7*24*60*60}; SameSite=${isSecure ? 'None' : 'Lax'};${isSecure ? ' Secure;' : ''}`;
        setToken(response.data.token);
      }
      
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
    setToken(undefined);
    // Clear token cookie on logout
    document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  };

  const isAdmin = user?.role === 'admin';

  const value: AuthContextValue = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin,
    token
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
