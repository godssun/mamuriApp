import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { subscriptionApi } from '../api/client';
import { SubscriptionInfo, SubscriptionStatusType } from '../types';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
  info: SubscriptionInfo | null;
  isLoading: boolean;
  /** ACTIVE 또는 TRIALING 상태인지 */
  isSubscribed: boolean;
  /** 구독이 ACTIVE 또는 TRIALING 상태인지 (isPremium 호환용) */
  isPremium: boolean;
  /** 체험 기간 활성 여부 */
  isTrialActive: boolean;
  /** 오늘 남은 일일 답변 수 (-1 = 무제한) */
  dailyRemaining: number;
  /** 위기 플래그 활성 여부 */
  hasCrisisFlag: boolean;
  /** legacy 호환 - quotaRemaining */
  quotaRemaining: number;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await subscriptionApi.getStatus();
      setInfo(data);
    } catch {
      // 실패 시 기본값 유지
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    } else {
      setInfo(null);
    }
  }, [isAuthenticated, refresh]);

  const isSubscribed = info?.status === 'ACTIVE' || info?.status === 'TRIALING';
  const isPremium = isSubscribed;
  const isTrialActive = info?.trialActive ?? false;
  const dailyRemaining = info?.dailyRepliesMax === -1 ? -1 : (info?.dailyRepliesMax ?? 0);
  const hasCrisisFlag = info?.crisisFlag ?? false;
  // legacy 호환
  const quotaRemaining = dailyRemaining === -1 ? Infinity : dailyRemaining;

  return (
    <SubscriptionContext.Provider
      value={{
        info,
        isLoading,
        isSubscribed,
        isPremium,
        isTrialActive,
        dailyRemaining,
        hasCrisisFlag,
        quotaRemaining,
        refresh,
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
