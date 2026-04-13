/**
 * IAP Service — RevenueCat wrapper for subscription management
 *
 * Handles:
 * - SDK initialization
 * - Product fetching (monthly/yearly)
 * - Purchase flow
 * - Restore purchases
 * - Entitlement checking
 *
 * RevenueCat API key는 app.config.ts의 extra에서 가져옴.
 * Sandbox/Production 자동 전환은 RevenueCat이 처리.
 */

import { Platform } from 'react-native';
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
  PurchasesEntitlementInfo,
} from 'react-native-purchases';
import { IAP_PRODUCTS } from '../types';

/** RevenueCat entitlement identifier (RevenueCat 대시보드에서 설정) */
const ENTITLEMENT_ID = 'premium';

/** RevenueCat offering identifier */
const OFFERING_ID = 'default';

/** RevenueCat API keys — 빌드 시 환경변수로 주입 */
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

export interface IAPProduct {
  identifier: string;
  title: string;
  description: string;
  priceString: string;
  /** 원시 가격 (비교용) */
  price: number;
  /** 'monthly' | 'yearly' */
  period: 'monthly' | 'yearly';
  /** RevenueCat package reference */
  package: PurchasesPackage;
  /** Introductory offer info — null이면 자격 없음 (이미 사용함) */
  introPrice: {
    priceString: string;
    periodNumberOfUnits: number;
    periodUnit: string;
  } | null;
}

export interface IAPState {
  isInitialized: boolean;
  isPremium: boolean;
  products: IAPProduct[];
  customerInfo: CustomerInfo | null;
}

class IAPService {
  private initialized = false;

  /**
   * RevenueCat SDK 초기화
   * 앱 시작 시 한 번만 호출
   */
  async initialize(userId?: string): Promise<void> {
    if (this.initialized) return;

    const apiKey = Platform.OS === 'ios'
      ? REVENUECAT_API_KEY_IOS
      : REVENUECAT_API_KEY_ANDROID;

    if (!apiKey) {
      console.warn('[IAP] RevenueCat API key not configured. IAP disabled.');
      console.warn('[IAP] Platform:', Platform.OS, 'iOS key:', REVENUECAT_API_KEY_IOS ? 'SET' : 'EMPTY', 'Android key:', REVENUECAT_API_KEY_ANDROID ? 'SET' : 'EMPTY');
      return;
    }

    try {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);

      Purchases.configure({
        apiKey,
        appUserID: userId || undefined,
      });

      this.initialized = true;
      console.log('[IAP] RevenueCat initialized. Platform:', Platform.OS, 'Key prefix:', apiKey.substring(0, 8) + '...');
    } catch (error) {
      console.error('[IAP] Failed to initialize RevenueCat:', error);
    }
  }

  /**
   * RevenueCat 사용자 ID를 앱 사용자와 연결
   * 로그인 후 호출
   */
  async login(userId: string): Promise<CustomerInfo | null> {
    if (!this.initialized) return null;
    try {
      const { customerInfo } = await Purchases.logIn(userId.toString());
      return customerInfo;
    } catch (error) {
      console.error('[IAP] Login failed:', error);
      return null;
    }
  }

  /**
   * 로그아웃 시 RevenueCat 사용자 리셋
   */
  async logout(): Promise<void> {
    if (!this.initialized) return;
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      if (!customerInfo.originalAppUserId.startsWith('$RCAnonymousID:')) {
        await Purchases.logOut();
      }
    } catch {
      // anonymous user logout — 무시
    }
  }

  /**
   * 구독 상품 목록 조회
   */
  async getProducts(): Promise<IAPProduct[]> {
    if (!this.initialized) {
      console.warn('[IAP] getProducts called but SDK not initialized. Platform:', Platform.OS);
      return [];
    }

    try {
      const offerings = await Purchases.getOfferings();
      console.log('[IAP] Offerings response:', JSON.stringify({
        hasCurrentOffering: !!offerings.current,
        offeringIds: Object.keys(offerings.all),
        currentMonthly: !!offerings.current?.monthly,
        currentAnnual: !!offerings.current?.annual,
        availablePackages: offerings.current?.availablePackages?.length ?? 0,
      }));

      const current = offerings.current;
      if (!current) {
        console.warn('[IAP] No current offering available. Check RevenueCat dashboard: Offerings → default → Packages');
        return [];
      }

      const products: IAPProduct[] = [];

      if (current.monthly) {
        products.push(this.packageToProduct(current.monthly, 'monthly'));
      }

      if (current.annual) {
        products.push(this.packageToProduct(current.annual, 'yearly'));
      }

      // fallback: availablePackages에서 찾기
      if (products.length === 0 && current.availablePackages.length > 0) {
        console.log('[IAP] Using availablePackages fallback:', current.availablePackages.map(p => p.identifier));
        for (const pkg of current.availablePackages) {
          const id = pkg.product.identifier;
          if (id.includes('monthly')) {
            products.push(this.packageToProduct(pkg, 'monthly'));
          } else if (id.includes('yearly') || id.includes('annual')) {
            products.push(this.packageToProduct(pkg, 'yearly'));
          }
        }
      }

      if (products.length === 0) {
        console.warn('[IAP] No monthly/annual packages found in current offering. Available:',
          current.availablePackages.map(p => `${p.identifier}: ${p.product.identifier}`));
      }

      return products;
    } catch (error: any) {
      console.warn('[IAP] Products not available. Platform:', Platform.OS, 'Error:', error?.message || error);
      return [];
    }
  }

  /**
   * 구독 구매
   */
  async purchase(product: IAPProduct): Promise<{ success: boolean; customerInfo: CustomerInfo | null }> {
    if (!this.initialized) return { success: false, customerInfo: null };

    try {
      const { customerInfo } = await Purchases.purchasePackage(product.package);
      const isPremium = this.checkPremium(customerInfo);
      return { success: isPremium, customerInfo };
    } catch (error: any) {
      if (error.userCancelled) {
        return { success: false, customerInfo: null };
      }
      console.error('[IAP] Purchase failed:', error);
      throw error;
    }
  }

  /**
   * 구매 복원
   */
  async restorePurchases(): Promise<{ success: boolean; customerInfo: CustomerInfo | null }> {
    if (!this.initialized) return { success: false, customerInfo: null };

    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPremium = this.checkPremium(customerInfo);
      return { success: isPremium, customerInfo };
    } catch (error) {
      console.error('[IAP] Restore failed:', error);
      throw error;
    }
  }

  /**
   * 현재 구독 상태 확인
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.initialized) return null;
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('[IAP] Failed to get customer info:', error);
      return null;
    }
  }

  /**
   * premium entitlement 확인
   */
  checkPremium(customerInfo: CustomerInfo): boolean {
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  }

  /**
   * 구독 관리 페이지 열기 (App Store 설정)
   */
  async openSubscriptionManagement(): Promise<void> {
    if (!this.initialized) return;
    try {
      await Purchases.showManageSubscriptions();
    } catch (error) {
      console.error('[IAP] Failed to open subscription management:', error);
    }
  }

  private packageToProduct(pkg: PurchasesPackage, period: 'monthly' | 'yearly'): IAPProduct {
    const product = pkg.product;
    console.log(`[IAP] packageToProduct: ${product.identifier}`, JSON.stringify({
      title: product.title,
      priceString: product.priceString,
      price: product.price,
      hasIntroPrice: !!product.introPrice,
    }));
    return {
      identifier: product.identifier,
      title: product.title || product.identifier,  // fallback for empty title
      description: product.description || '',
      priceString: product.priceString,
      price: product.price,
      period,
      package: pkg,
      introPrice: product.introPrice ? {
        priceString: product.introPrice.priceString,
        periodNumberOfUnits: product.introPrice.periodNumberOfUnits,
        periodUnit: product.introPrice.periodUnit,
      } : null,
    };
  }
}

/** 싱글톤 IAP 서비스 인스턴스 */
export const iapService = new IAPService();
