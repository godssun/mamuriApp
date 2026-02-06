import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, tokenStorage } from '../api/client';
import { SignupRequest, LoginRequest } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 시작 시 토큰 확인
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const tokens = await tokenStorage.get();
      setIsAuthenticated(!!tokens?.accessToken);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (data: LoginRequest) => {
    await authApi.login(data);
    setIsAuthenticated(true);
  }, []);

  const signup = useCallback(async (data: SignupRequest) => {
    await authApi.signup(data);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
