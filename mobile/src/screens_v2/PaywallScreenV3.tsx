/**
 * PaywallScreen V3 — Premium subscription paywall
 *
 * v3 scrapbook design: warm paper, serif titles, sage accents.
 * Shows subscription benefits, monthly/yearly options, purchase/restore.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  colors, fontFamily, shadows, spacing, borderRadius, layout,
} from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import { useSubscription } from '../contexts/SubscriptionContext';
import type { IAPProduct } from '../services/iap';

export default function PaywallScreenV3() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const { t } = useTranslation();
  const {
    products, isLoadingProducts, isPurchasing, isPremium,
    purchase, restorePurchases, refresh,
  } = useSubscription();

  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('yearly');

  const monthly = products.find(p => p.period === 'monthly');
  const yearly = products.find(p => p.period === 'yearly');
  const selected = selectedPeriod === 'yearly' ? yearly : monthly;

  // ── 진단 로그: 버튼 비활성화 원인 추적 ──
  useEffect(() => {
    console.log('[Paywall] State:', JSON.stringify({
      productsCount: products.length,
      isLoadingProducts,
      isPurchasing,
      isPremium,
      hasMonthly: !!monthly,
      hasYearly: !!yearly,
      selectedPeriod,
      hasSelected: !!selected,
      selectedId: selected?.identifier,
      selectedPrice: selected?.priceString,
      btnDisabled: !selected || isPurchasing,
    }));
  }, [products, isLoadingProducts, isPurchasing, isPremium, selected]);

  const handlePurchase = async () => {
    if (!selected) return;
    const success = await purchase(selected);
    if (success) {
      nav.goBack();
    }
  };

  const handleRestore = async () => {
    const success = await restorePurchases();
    if (success) {
      Alert.alert(t('common.alert'), t('premium.restoreSuccess'));
      nav.goBack();
    } else {
      Alert.alert(t('common.alert'), t('premium.restoreNone'));
    }
  };

  // 이미 구독 중이면 구독 중 UI
  if (isPremium) {
    return (
      <PaperBackground variant="plain" color="cream" style={{ paddingTop: insets.top }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={s.activeContainer}>
          <View style={[s.heroBadge, { width: 64, height: 64, borderRadius: 32 }]}>
            <Text style={[s.heroBadgeText, { fontSize: 20 }]}>PRO</Text>
          </View>
          <Text style={s.activeTitle}>{t('premium.alreadyActive')}</Text>
          <Text style={s.activeDesc}>{t('premium.enjoyFeatures')}</Text>
        </View>
      </PaperBackground>
    );
  }

  return (
    <PaperBackground variant="plain" color="cream" style={{ paddingTop: insets.top }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={s.heroSection}>
          <View style={s.heroBadge}>
            <Text style={s.heroBadgeText}>PRO</Text>
          </View>
          <Text style={s.heroTitle}>{t('premium.paywallTitle')}</Text>
          <Text style={s.heroDesc}>{t('premium.paywallDesc')}</Text>
        </View>

        {/* Benefits */}
        <View style={s.benefitsCard}>
          {[
            { icon: '1', text: t('premium.benefit1') },
            { icon: '2', text: t('premium.benefit2') },
            { icon: '3', text: t('premium.benefit3') },
            { icon: '4', text: t('premium.benefit4') },
            { icon: '5', text: t('premium.benefit5') },
          ].map((b, i) => (
            <View key={i} style={s.benefitRow}>
              <View style={s.benefitDot}>
                <Text style={s.benefitDotText}>{b.icon}</Text>
              </View>
              <Text style={s.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* Plan Selection */}
        {isLoadingProducts ? (
          <ActivityIndicator color={colors.accentPrimary} style={{ marginVertical: spacing['2xl'] }} />
        ) : products.length === 0 ? (
          <View style={s.errorContainer}>
            <Text style={s.errorText}>{t('premium.loadFailed')}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={refresh} activeOpacity={0.7}>
              <Text style={s.retryText}>{t('premium.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.planSection}>
            {/* Yearly */}
            <TouchableOpacity
              style={[s.planCard, selectedPeriod === 'yearly' && s.planSelected]}
              onPress={() => setSelectedPeriod('yearly')}
              activeOpacity={0.7}
            >
              <View style={s.planHeader}>
                <View style={s.planRadio}>
                  {selectedPeriod === 'yearly' && <View style={s.planRadioFill} />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.planTitleRow}>
                    <Text style={[s.planTitle, selectedPeriod === 'yearly' && s.planTitleActive]}>
                      {t('premium.yearly')}
                    </Text>
                    <View style={s.discountBadge}>
                      <Text style={s.discountText}>{t('premium.yearlyDiscount')}</Text>
                    </View>
                  </View>
                  <Text style={s.planPrice}>
                    {yearly?.priceString || t('premium.yearlyPrice')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Monthly */}
            <TouchableOpacity
              style={[s.planCard, selectedPeriod === 'monthly' && s.planSelected]}
              onPress={() => setSelectedPeriod('monthly')}
              activeOpacity={0.7}
            >
              <View style={s.planHeader}>
                <View style={s.planRadio}>
                  {selectedPeriod === 'monthly' && <View style={s.planRadioFill} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.planTitle, selectedPeriod === 'monthly' && s.planTitleActive]}>
                    {t('premium.monthly')}
                  </Text>
                  <Text style={s.planPrice}>
                    {monthly?.priceString || t('premium.monthlyPrice')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Trial + Purchase + Restore — products 로드 후에만 표시 */}
        {selected && (
          <>
            {/* Trial info — introPrice가 있을 때만 표시 (자격 없으면 숨김) */}
            {selected.introPrice && (
              <>
                <Text style={s.trialInfo}>{t('premium.freeTrial')}</Text>
                <Text style={s.trialDesc}>{t('premium.trialDesc')}</Text>
              </>
            )}

            {/* Purchase Button */}
            <TouchableOpacity
              style={[s.purchaseBtn, isPurchasing && s.purchaseBtnDisabled]}
              onPress={handlePurchase}
              disabled={isPurchasing}
              activeOpacity={0.8}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={s.purchaseBtnText}>{t('premium.subscribe')}</Text>
              )}
            </TouchableOpacity>

            {/* Restore */}
            <TouchableOpacity style={s.restoreBtn} onPress={handleRestore} activeOpacity={0.6}>
              <Text style={s.restoreText}>{t('premium.restorePurchase')}</Text>
            </TouchableOpacity>

            {/* Legal */}
            <Text style={s.legalText}>{t('premium.legalNote')}</Text>
          </>
        )}

        <View style={{ height: spacing['4xl'] }} />
      </ScrollView>
    </PaperBackground>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing.md,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  backText: { fontFamily: fontFamily.sansLight, fontSize: 22, color: colors.textPrimary },

  scroll: { paddingHorizontal: layout.screenPaddingH, paddingBottom: 40 },

  // Hero
  heroSection: { alignItems: 'center', marginBottom: spacing['2xl'] },
  heroBadge: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.accentPrimary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroBadgeText: {
    fontFamily: fontFamily.sansSemiBold, fontSize: 14,
    color: '#FFFFFF', letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: fontFamily.serifItalic, fontSize: 24,
    color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm,
  },
  heroDesc: {
    fontFamily: fontFamily.sans, fontSize: 14,
    color: colors.textSecondary, textAlign: 'center', lineHeight: 22,
  },

  // Benefits
  benefitsCard: {
    backgroundColor: colors.bgIvory, borderRadius: borderRadius.sm,
    padding: spacing.xl, marginBottom: spacing['2xl'],
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    ...shadows.crisp, gap: spacing.lg,
  },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  benefitDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.accentPrimary + '20',
    justifyContent: 'center', alignItems: 'center',
  },
  benefitDotText: {
    fontFamily: fontFamily.sansSemiBold, fontSize: 11,
    color: colors.accentPrimary,
  },
  benefitText: {
    fontFamily: fontFamily.sans, fontSize: 15, color: colors.textPrimary,
    flex: 1, lineHeight: 22,
  },

  // Plans
  planSection: { gap: spacing.md, marginBottom: spacing.xl },
  planCard: {
    backgroundColor: colors.bgIvory, borderRadius: borderRadius.sm,
    padding: spacing.lg, borderWidth: 1.5,
    borderColor: colors.accentSand + '40',
  },
  planSelected: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimaryLight + '10',
  },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  planRadio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.accentSand,
    justifyContent: 'center', alignItems: 'center',
  },
  planRadioFill: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.accentPrimary,
  },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  planTitle: {
    fontFamily: fontFamily.sansMedium, fontSize: 16,
    color: colors.textPrimary,
  },
  planTitleActive: { color: colors.accentPrimary },
  planPrice: {
    fontFamily: fontFamily.sans, fontSize: 13,
    color: colors.textSecondary, marginTop: 2,
  },
  discountBadge: {
    backgroundColor: colors.accentPrimary + '20',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontFamily: fontFamily.sansSemiBold, fontSize: 10,
    color: colors.accentPrimary,
  },

  // Error state
  errorContainer: {
    alignItems: 'center' as const,
    marginVertical: spacing['2xl'],
    gap: spacing.md,
  },
  errorText: {
    fontFamily: fontFamily.sans, fontSize: 14,
    color: colors.textSecondary, textAlign: 'center' as const,
  },
  retryBtn: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: colors.accentPrimary,
  },
  retryText: {
    fontFamily: fontFamily.sansMedium, fontSize: 14,
    color: colors.accentPrimary,
  },

  // Trial
  trialInfo: {
    fontFamily: fontFamily.sansMedium, fontSize: 14,
    color: colors.accentPrimary, textAlign: 'center',
    marginBottom: spacing.xs,
  },
  trialDesc: {
    fontFamily: fontFamily.sans, fontSize: 12,
    color: colors.textTertiary, textAlign: 'center',
    marginBottom: spacing.xl,
  },

  // Purchase button
  purchaseBtn: {
    backgroundColor: colors.accentPrimary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  purchaseBtnDisabled: { opacity: 0.5 },
  purchaseBtnText: {
    fontFamily: fontFamily.sansSemiBold, fontSize: 16,
    color: '#FFFFFF',
  },

  // Restore
  restoreBtn: { alignItems: 'center', paddingVertical: spacing.md },
  restoreText: {
    fontFamily: fontFamily.sans, fontSize: 13,
    color: colors.textTertiary, textDecorationLine: 'underline',
  },

  // Legal
  legalText: {
    fontFamily: fontFamily.sans, fontSize: 10,
    color: colors.textTertiary, textAlign: 'center',
    lineHeight: 16, marginTop: spacing.md,
  },

  // Already active
  activeContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  activeTitle: {
    fontFamily: fontFamily.serifItalic, fontSize: 22,
    color: colors.textPrimary, marginBottom: spacing.sm,
  },
  activeDesc: {
    fontFamily: fontFamily.sans, fontSize: 14,
    color: colors.textSecondary, textAlign: 'center',
  },
});
