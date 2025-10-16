import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, RegisterData, LoginData } from '../types';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      const savedUser = authService.getUser();

      if (token && savedUser) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          authService.saveUser(currentUser);
        } catch (error) {
          authService.removeToken();
          authService.removeUser();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data: LoginData) => {
    const response = await authService.login(data);
    authService.saveToken(response.token);
    authService.saveUser(response.user);
    setUser(response.user);
  };

  const register = async (data: RegisterData) => {
    const response = await authService.register(data);
    authService.saveToken(response.token);
    authService.saveUser(response.user);
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.removeToken();
      authService.removeUser();
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
