import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, tokenStorage, consentStorage, setForceLogoutHandler, clearForceLogoutHandler } from '../api/client';
import { SignupRequest, LoginRequest, SocialProvider } from '../types';
import { signOutFromProviders } from '../services/socialAuth';

const AUTH_PROVIDER_KEY = 'auth_provider';
const COMPANION_NAME_KEY = 'companion_name';

export async function getStoredAuthProvider(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_PROVIDER_KEY);
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isNewUser: boolean;
  companionName: string;
  setCompanionName: (name: string) => void;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  socialLogin: (provider: SocialProvider, token: string) => Promise<{ isNewUser: boolean }>;
  completeSocialSignup: (provider: SocialProvider, token: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: () => void;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [companionName, setCompanionNameState] = useState('');

  // companionName SSoT — AsyncStorage에 영속화하여 재실행 시 first paint부터 값 공급.
  // 서버 재조회(MainTabsNavigator)는 정합성 검증 용도로 유지.
  const setCompanionName = useCallback((name: string) => {
    setCompanionNameState(name);
    if (name) {
      AsyncStorage.setItem(COMPANION_NAME_KEY, name).catch(() => {});
    } else {
      AsyncStorage.removeItem(COMPANION_NAME_KEY).catch(() => {});
    }
  }, []);

  // 앱 시작 시 저장된 companionName 복구 (서버 응답 전에 fallback race 제거)
  useEffect(() => {
    AsyncStorage.getItem(COMPANION_NAME_KEY)
      .then((stored) => {
        if (stored) setCompanionNameState(stored);
      })
      .catch(() => {});
  }, []);

  // forceLogout: API client에서 TOKEN_REUSE_DETECTED 등 호출
  const forceLogout = useCallback(() => {
    tokenStorage.clear();
    SecureStore.deleteItemAsync(AUTH_PROVIDER_KEY);
    consentStorage.clear();
    AsyncStorage.removeItem(COMPANION_NAME_KEY).catch(() => {});
    setCompanionNameState('');
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
    await SecureStore.setItemAsync(AUTH_PROVIDER_KEY, 'EMAIL');
    setIsAuthenticated(true);
  }, []);

  const signup = useCallback(async (data: SignupRequest) => {
    await authApi.signup(data);
    await SecureStore.setItemAsync(AUTH_PROVIDER_KEY, 'EMAIL');
    setIsNewUser(true);
    setIsAuthenticated(true);
  }, []);

  const socialLogin = useCallback(async (provider: SocialProvider, token: string) => {
    const response = await authApi.socialLogin({ provider, token });
    if (!response.isNewUser && response.accessToken) {
      // 기존 사용자 → 바로 로그인
      await SecureStore.setItemAsync(AUTH_PROVIDER_KEY, provider);
      setIsAuthenticated(true);
      return { isNewUser: false };
    }
    // 신규 사용자 → 닉네임 입력 필요
    return { isNewUser: true };
  }, []);

  const completeSocialSignup = useCallback(async (provider: SocialProvider, token: string, nickname: string) => {
    const response = await authApi.socialLogin({ provider, token, nickname });
    if (response.accessToken) {
      await SecureStore.setItemAsync(AUTH_PROVIDER_KEY, provider);
      setIsNewUser(true);
      setIsAuthenticated(true);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // 서버 로그아웃 실패해도 로컬 상태는 초기화
    }
    // 소셜 SDK 로그아웃
    await signOutFromProviders();
    await SecureStore.deleteItemAsync(AUTH_PROVIDER_KEY);
    await AsyncStorage.removeItem(COMPANION_NAME_KEY).catch(() => {});
    setCompanionNameState('');
    setIsAuthenticated(false);
    setIsNewUser(false);
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsNewUser(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated, isLoading, isNewUser, companionName, setCompanionName,
      login, signup, socialLogin, completeSocialSignup, logout, forceLogout, completeOnboarding,
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
