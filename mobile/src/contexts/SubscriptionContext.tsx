/**
 * SubscriptionContext — 구독 상태 + IAP + entitlement 통합 관리
 *
 * 초기화 순서:
 * 1. Purchases.configure() — RevenueCat SDK 초기화
 * 2. getCustomerInfo() — 현재 premium 상태 확인
 * 3. getOfferings() — 상품 목록 조회
 * 4. Backend API — 서버 상태 (AI 할당량 등) 조회
 *
 * configure 전에 offerings/customerInfo를 읽으면 실패하므로
 * 반드시 initializeIAP → loadProducts 순서를 보장합니다.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import i18n from '../i18n/i18n';
import { subscriptionApi } from '../api/client';
import { iapService, IAPProduct } from '../services/iap';
import { SubscriptionInfo, PremiumEntitlements } from '../types';
import { useAuth } from './AuthContext';

const FREE_ENTITLEMENTS: PremiumEntitlements = {
  canCreateCustomSticker: false,
  aiCommentDailyLimit: 1,
  aiConversationDailyLimit: 3,
  canUsePremiumThemes: false,
  canUsePremiumFonts: false,
  canViewAdvancedReports: false,
};

const PREMIUM_ENTITLEMENTS: PremiumEntitlements = {
  canCreateCustomSticker: true,
  aiCommentDailyLimit: 10,
  aiConversationDailyLimit: 30,
  canUsePremiumThemes: true,
  canUsePremiumFonts: true,
  canViewAdvancedReports: true,
};

interface SubscriptionContextType {
  info: SubscriptionInfo | null;
  isLoading: boolean;
  isSubscribed: boolean;
  isPremium: boolean;
  isTrialActive: boolean;
  dailyRemaining: number;
  hasCrisisFlag: boolean;
  quotaRemaining: number;
  entitlements: PremiumEntitlements;
  products: IAPProduct[];
  isLoadingProducts: boolean;
  isPurchasing: boolean;
  purchase: (product: IAPProduct) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  openManagement: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [iapPremium, setIapPremium] = useState(false);
  const iapReady = useRef(false);

  // ── 백엔드 상태 조회 ──
  const refreshServerStatus = useCallback(async () => {
    try {
      const data = await subscriptionApi.getStatus();
      setInfo(data);
    } catch {
      // 서버 실패 시 기본값 유지 — IAP 상태로 대체 가능
    }
  }, []);

  // ── 상품 조회 (configure 완료 후에만 호출) ──
  const loadProducts = useCallback(async () => {
    if (!iapReady.current) return;
    setIsLoadingProducts(true);
    try {
      const prods = await iapService.getProducts();
      setProducts(prods);
      console.log(`[IAP] Loaded ${prods.length} products`);
    } catch (error) {
      console.error('[IAP] Failed to load products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // ── 앱 시작 시 초기화 (순서 보장) ──
  useEffect(() => {
    if (!isAuthenticated) {
      setInfo(null);
      setIapPremium(false);
      setProducts([]);
      iapReady.current = false;
      iapService.logout();
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      setIsLoading(true);
      try {
        // Step 1: RevenueCat SDK 초기화 (Purchases.configure)
        await iapService.initialize();
        iapReady.current = true;

        if (cancelled) return;

        // Step 2: configure 완료 후 병렬로 실행
        const [customerInfo] = await Promise.all([
          iapService.getCustomerInfo(),     // premium 상태
          loadProducts(),                    // 상품 조회
          refreshServerStatus(),             // 서버 상태
        ]);

        if (cancelled) return;

        if (customerInfo) {
          setIapPremium(iapService.checkPremium(customerInfo));
        }
      } catch (error) {
        console.error('[Subscription] Bootstrap failed:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // ── 앱 포그라운드 복귀 시 상태 새로고침 ──
  useEffect(() => {
    const handleAppState = async (state: AppStateStatus) => {
      if (state === 'active' && isAuthenticated && iapReady.current) {
        const customerInfo = await iapService.getCustomerInfo();
        if (customerInfo) {
          setIapPremium(iapService.checkPremium(customerInfo));
        }
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [isAuthenticated]);

  // ── 구매 ──
  const purchase = useCallback(async (product: IAPProduct): Promise<boolean> => {
    setIsPurchasing(true);
    try {
      const result = await iapService.purchase(product);
      if (result.success) {
        setIapPremium(true);
        await refreshServerStatus();
        return true;
      }
      return false;
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert(i18n.t('premium.purchaseFailed'), error?.message || i18n.t('common.retryLater'));
      }
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, [refreshServerStatus]);

  // ── 복원 ──
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    setIsPurchasing(true);
    try {
      const result = await iapService.restorePurchases();
      setIapPremium(result.success);
      if (result.success) {
        await refreshServerStatus();
      }
      return result.success;
    } catch (error: any) {
      Alert.alert(i18n.t('premium.restoreFailed'), error?.message || i18n.t('common.retryLater'));
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, [refreshServerStatus]);

  // ── 구독 관리 ──
  const openManagement = useCallback(async () => {
    await iapService.openSubscriptionManagement();
  }, []);

  // ── 통합 새로고침 ──
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [customerInfo] = await Promise.all([
        iapService.getCustomerInfo(),
        refreshServerStatus(),
        iapReady.current ? loadProducts() : Promise.resolve(),
      ]);
      if (customerInfo) {
        setIapPremium(iapService.checkPremium(customerInfo));
      }
    } finally {
      setIsLoading(false);
    }
  }, [refreshServerStatus, loadProducts]);

  // ── 상태 계산 ──
  const serverPremium = info?.status === 'ACTIVE' || info?.status === 'TRIALING';
  const isPremium = iapPremium || serverPremium;
  const isSubscribed = isPremium;
  const isTrialActive = info?.trialActive ?? false;
  const dailyRemaining = info?.dailyRepliesMax === -1 ? -1 : (info?.dailyRepliesMax ?? 0);
  const hasCrisisFlag = info?.crisisFlag ?? false;
  const quotaRemaining = dailyRemaining === -1 ? Infinity : dailyRemaining;

  const entitlements = useMemo<PremiumEntitlements>(() => {
    if (isPremium) return PREMIUM_ENTITLEMENTS;
    if (hasCrisisFlag) return {
      ...FREE_ENTITLEMENTS,
      aiConversationDailyLimit: 30,
      aiCommentDailyLimit: 10,
    };
    return FREE_ENTITLEMENTS;
  }, [isPremium, hasCrisisFlag]);

  return (
    <SubscriptionContext.Provider
      value={{
        info, isLoading, isSubscribed, isPremium, isTrialActive,
        dailyRemaining, hasCrisisFlag, quotaRemaining, entitlements,
        products, isLoadingProducts, isPurchasing,
        purchase, restorePurchases, openManagement, refresh,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
