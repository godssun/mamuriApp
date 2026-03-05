/**
 * Design System v2 — Subscription Screen
 *
 * Plan selection, checkout, and subscription management.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types';
import { useTranslation } from 'react-i18next';
import { subscriptionApi, ApiError } from '../api/client';
import i18n from '../i18n/i18n';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useThemeV2 } from '../design-system-v2';
import { ScreenContainer } from './components/ScreenContainer';
import { Button } from './components/Button';

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Subscription'>;
};

type PlanTier = 'deluxe' | 'premium';
type PlanPeriod = 'monthly' | 'yearly';

interface Plan {
  tier: PlanTier;
  period: PlanPeriod;
  name: string;
  price: string;
  periodLabel: string;
  priceId: string;
  features: string[];
  badge?: string;
}

export function SubscriptionScreenV2({ navigation }: Props) {
  const { t } = useTranslation();
  const { info, isSubscribed, refresh } = useSubscription();
  const { theme } = useThemeV2();

  const plans: Plan[] = [
    { tier: 'deluxe', period: 'monthly', name: t('subscription.deluxeMonthly'), price: '4,900원', periodLabel: t('subscription.perMonth'), priceId: 'price_deluxe_monthly', features: [t('subscription.feature3Replies'), t('subscription.featurePersonalize'), t('subscription.featureStreak')] },
    { tier: 'deluxe', period: 'yearly', name: t('subscription.deluxeYearly'), price: '49,000원', periodLabel: t('subscription.perYear'), priceId: 'price_deluxe_yearly', features: [t('subscription.feature3Replies'), t('subscription.featurePersonalize'), t('subscription.featureStreak')], badge: t('subscription.discount17') },
    { tier: 'premium', period: 'monthly', name: t('subscription.premiumMonthly'), price: '9,900원', periodLabel: t('subscription.perMonth'), priceId: 'price_premium_monthly', features: [t('subscription.featureUnlimited'), t('subscription.featurePersonalize'), t('subscription.featureStreak'), t('subscription.featurePriority')] },
    { tier: 'premium', period: 'yearly', name: t('subscription.premiumYearly'), price: '99,000원', periodLabel: t('subscription.perYear'), priceId: 'price_premium_yearly', features: [t('subscription.featureUnlimited'), t('subscription.featurePersonalize'), t('subscription.featureStreak'), t('subscription.featurePriority')], badge: t('subscription.discount17') },
  ];
  const [selectedTier, setSelectedTier] = useState<PlanTier>('deluxe');
  const [selectedPeriod, setSelectedPeriod] = useState<PlanPeriod>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const selectedPlan = plans.find(
    (p) => p.tier === selectedTier && p.period === selectedPeriod
  );

  const currentTier = info?.tier ?? 'FREE';

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    setIsLoading(true);
    try {
      const { checkoutUrl } = await subscriptionApi.createCheckout(selectedPlan.priceId);
      await Linking.openURL(checkoutUrl);
      setTimeout(() => refresh(), 3000);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('subscription.checkoutFailed');
      Alert.alert(t('common.error'), message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      t('subscription.cancelSubscription'),
      t('subscription.cancelConfirm'),
      [
        { text: t('subscription.keepSubscription'), style: 'cancel' },
        {
          text: t('subscription.cancelAction'),
          style: 'destructive',
          onPress: async () => {
            setIsCanceling(true);
            try {
              await subscriptionApi.cancel();
              await refresh();
              Alert.alert(t('subscription.complete'), t('subscription.cancelComplete'));
            } catch (error) {
              const message = error instanceof ApiError ? error.message : t('subscription.cancelFailed');
              Alert.alert(t('common.error'), message);
            } finally {
              setIsCanceling(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const lang = i18n.language;
    const locale = lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US';
    return new Date(dateStr).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'DELUXE': return t('subscription.deluxe');
      case 'PREMIUM': return t('subscription.premium');
      default: return t('subscription.free');
    }
  };

  const header = (
    <View style={[styles.header, { paddingHorizontal: theme.layout.screenPaddingH }]}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={[theme.typography.bodyMedium, { color: theme.colors.primary }]}>{t('subscription.back')}</Text>
      </TouchableOpacity>
      <Text style={[theme.typography.titleMedium, { color: theme.colors.textPrimary }]}>{t('subscription.manage')}</Text>
      <View style={{ width: 50 }} />
    </View>
  );

  return (
    <ScreenContainer header={header}>
      {/* 현재 상태 */}
      <View style={[styles.statusCard, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, ...theme.shadows.sm }]}>
        <View style={styles.statusHeader}>
          <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}>{t('subscription.currentPlan')}</Text>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: isSubscribed ? theme.colors.primarySubtle : theme.colors.surfaceSecondary,
              borderRadius: theme.borderRadius.sm,
            },
          ]}>
            <Text style={[
              theme.typography.labelSmall,
              { color: isSubscribed ? theme.colors.primary : theme.colors.textSecondary },
            ]}>
              {getTierLabel(currentTier)}
            </Text>
          </View>
        </View>

        {info?.trialActive && (
          <Text style={[theme.typography.bodySmall, { color: theme.colors.primary, fontWeight: '500' }]}>
            {t('subscription.trialPeriod', { date: formatDate(info.trialEnd) })}
          </Text>
        )}

        {isSubscribed && info?.currentPeriodEnd && !info.trialActive && (
          <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}>
            {t('subscription.nextBilling', { date: formatDate(info.currentPeriodEnd) })}
          </Text>
        )}
      </View>

      {/* 플랜 선택 (미구독자만) */}
      {!isSubscribed && (
        <>
          <Text style={[theme.typography.labelMedium, { color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginTop: theme.spacing['2xl'], marginBottom: theme.spacing.md }]}>
            {t('subscription.selectPlan')}
          </Text>

          {/* 티어 선택 */}
          <View style={[styles.tierSelector, { gap: theme.spacing.md, marginBottom: theme.spacing.lg }]}>
            {(['deluxe', 'premium'] as PlanTier[]).map((tier) => {
              const isSelected = selectedTier === tier;
              return (
                <TouchableOpacity
                  key={tier}
                  style={[
                    styles.tierTab,
                    {
                      backgroundColor: isSelected ? theme.colors.primarySubtle : theme.colors.surface,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      borderRadius: theme.borderRadius.lg,
                    },
                  ]}
                  onPress={() => setSelectedTier(tier)}
                >
                  <Text style={[
                    theme.typography.titleSmall,
                    { color: isSelected ? theme.colors.primary : theme.colors.textSecondary },
                  ]}>
                    {tier === 'deluxe' ? t('subscription.deluxe') : t('subscription.premium')}
                  </Text>
                  <Text style={[
                    theme.typography.bodySmall,
                    { color: isSelected ? theme.colors.primary : theme.colors.textTertiary },
                  ]}>
                    {tier === 'deluxe' ? t('paywall.deluxePrice') : t('paywall.premiumPrice')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 기간 선택 */}
          <View style={[styles.periodSelector, { backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.borderRadius.sm, marginBottom: theme.spacing.xl }]}>
            {(['monthly', 'yearly'] as PlanPeriod[]).map((period) => {
              const isSelected = selectedPeriod === period;
              return (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodTab,
                    isSelected && { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xs },
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Text style={[
                    theme.typography.bodySmall,
                    { color: isSelected ? theme.colors.textPrimary : theme.colors.textTertiary },
                    isSelected && { fontWeight: '600' },
                  ]}>
                    {period === 'monthly' ? t('subscription.monthly') : t('subscription.yearly')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 선택된 플랜 상세 */}
          {selectedPlan && (
            <View style={[styles.planDetail, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, ...theme.shadows.sm }]}>
              <Text style={[theme.typography.titleLarge, { color: theme.colors.textPrimary, marginBottom: theme.spacing.xs }]}>
                {selectedPlan.name}
              </Text>
              <Text style={[theme.typography.headlineMedium, { color: theme.colors.primary, marginBottom: theme.spacing.lg }]}>
                {selectedPlan.price}{selectedPlan.periodLabel}
              </Text>
              <View style={{ gap: theme.spacing.sm }}>
                {selectedPlan.features.map((feature, i) => (
                  <Text key={i} style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}>
                    ✓ {feature}
                  </Text>
                ))}
              </View>
            </View>
          )}

          <Text style={[theme.typography.bodySmall, { color: theme.colors.primary, textAlign: 'center', marginVertical: theme.spacing.lg }]}>
            {t('subscription.trialInfo')}
          </Text>

          <Button
            label={t('subscription.startSubscription')}
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleCheckout}
            loading={isLoading}
          />
        </>
      )}

      {/* 구독 취소 (구독자만) */}
      {isSubscribed && (
        <View style={{ marginTop: theme.spacing.lg }}>
          <Button
            label={t('subscription.cancelSubscription')}
            variant="danger"
            fullWidth
            onPress={handleCancel}
            loading={isCanceling}
          />
        </View>
      )}
    </ScreenContainer>
  );
}

export default SubscriptionScreenV2;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  statusCard: {
    padding: 20,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tierSelector: {
    flexDirection: 'row',
  },
  tierTab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 3,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  planDetail: {
    padding: 20,
    marginBottom: 16,
  },
});
