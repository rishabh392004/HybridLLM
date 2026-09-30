import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../api/types';
import {
  api,
  clearStoredToken,
  getStoredToken,
  getStoredUser,
  setStoredUser,
} from '../api/client';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  isAuthenticated: boolean;
  theme: 'dark' | 'light';
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    // Default to light blue theme as requested by user
    const saved = localStorage.getItem('forecombine_theme');
    if (saved === 'dark') {
      localStorage.setItem('forecombine_theme', 'light');
      return 'light';
    }
    return (saved as 'dark' | 'light') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('forecombine_theme', theme);
  }, [theme]);

  // Initial mock login so app starts readily authenticated for immediate evaluation if token exists or can auto-seed
  useEffect(() => {
    if (!token) {
      // Create initial demo user for smooth first-load experience
      const defaultUser: User = {
        id: 'usr-sih-demo',
        email: 'analyst@imd.gov.in',
        name: 'Dr. R. Sharma',
        role: 'analyst',
        agency: 'Ministry of Earth Sciences / IMD',
      };
      const initialToken = 'fc_jwt_demo_token';
      setToken(initialToken);
      setUser(defaultUser);
      localStorage.setItem('forecombine_token', initialToken);
      setStoredUser(defaultUser);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (email: string, password: string, role: UserRole) => {
    const res = await api.auth.register(email, password, role);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updated: User = {
      ...user,
      role: newRole,
      agency:
        newRole === 'farmer'
          ? 'KVK Agro-Climatic Unit'
          : newRole === 'disaster_management'
          ? 'SDRF Central Emergency Desk'
          : 'Ministry of Earth Sciences / IMD',
    };
    setUser(updated);
    setStoredUser(updated);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const role: UserRole = user?.role || 'analyst';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!token,
        theme,
        login,
        register,
        logout,
        switchRole,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
