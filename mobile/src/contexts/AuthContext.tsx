import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, tokenStorage, setForceLogoutHandler, clearForceLogoutHandler } from '../api/client';
import { SignupRequest, LoginRequest } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isNewUser: boolean;
  companionName: string;
  setCompanionName: (name: string) => void;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: () => void;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [companionName, setCompanionName] = useState('');

  // forceLogout: API client에서 TOKEN_REUSE_DETECTED 등 호출
  const forceLogout = useCallback(() => {
    tokenStorage.clear();
    setIsAuthenticated(false);
    setIsNewUser(false);
  }, []);

  // API client에 forceLogout 핸들러 등록/해제
  useEffect(() => {
    setForceLogoutHandler(forceLogout);
    return () => clearForceLogoutHandler();
  }, [forceLogout]);

  // 앱 시작 시 토큰 유효성 검증
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const tokens = await tokenStorage.get();
      if (!tokens?.refreshToken) {
        setIsAuthenticated(false);
        return;
      }

      // refreshToken으로 실제 서버 검증
      await authApi.refresh();
      setIsAuthenticated(true);
    } catch {
      await tokenStorage.clear();
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
    setIsNewUser(true);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // 서버 로그아웃 실패해도 로컬 상태는 초기화
    }
    setIsAuthenticated(false);
    setIsNewUser(false);
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsNewUser(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated, isLoading, isNewUser, companionName, setCompanionName,
      login, signup, logout, forceLogout, completeOnboarding,
    }}>
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
