import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { subscriptionApi } from '../api/client';
import { SubscriptionInfo, SubscriptionStatusType } from '../types';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
  info: SubscriptionInfo | null;
  isLoading: boolean;
  isPremium: boolean;
  quotaRemaining: number;
  hasCrisisFlag: boolean;
  refresh: () => Promise<void>;
}

const defaultInfo: SubscriptionInfo = {
  status: 'FREE' as SubscriptionStatusType,
  quotaUsed: 0,
  quotaLimit: 20,
  currentPeriodEnd: null,
  crisisFlag: false,
};

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

  const isPremium = info?.status === 'ACTIVE' || info?.status === 'TRIALING';
  const quotaRemaining = info
    ? (info.quotaLimit === -1 ? Infinity : info.quotaLimit - info.quotaUsed)
    : 20;
  const hasCrisisFlag = info?.crisisFlag ?? false;

  return (
    <SubscriptionContext.Provider
      value={{ info, isLoading, isPremium, quotaRemaining, hasCrisisFlag, refresh }}
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
