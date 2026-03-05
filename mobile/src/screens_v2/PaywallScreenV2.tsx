/**
 * Design System v2 — Paywall Screen
 *
 * Quota exceeded paywall with plan cards and trial banner.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useThemeV2 } from '../design-system-v2';
import CrisisBanner from '../components/CrisisBanner';
import { ScreenContainer } from './components/ScreenContainer';
import { Button } from './components/Button';

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Paywall'>;
};

export function PaywallScreenV2({ navigation }: Props) {
  const { t } = useTranslation();
  const { hasCrisisFlag } = useSubscription();
  const { theme } = useThemeV2();

  const plans = [
    {
      tier: 'DELUXE',
      label: t('paywall.deluxe'),
      price: t('paywall.deluxePrice'),
      highlight: false,
      benefits: [
        t('paywall.deluxeBenefit1'),
        t('paywall.deluxeBenefit2'),
      ],
    },
    {
      tier: 'PREMIUM',
      label: t('paywall.premium'),
      price: t('paywall.premiumPrice'),
      highlight: true,
      benefits: [
        t('paywall.premiumBenefit1'),
        t('paywall.premiumBenefit2'),
        t('paywall.premiumBenefit3'),
      ],
    },
  ];

  const header = (
    <View style={{ paddingHorizontal: theme.layout.screenPaddingH, paddingBottom: theme.spacing.sm }}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={[theme.typography.bodyMedium, { color: theme.colors.primary }]}>{t('paywall.back')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer header={header}>
      {hasCrisisFlag && <CrisisBanner />}

      {/* 히어로 */}
      <View style={{ alignItems: 'center', paddingVertical: theme.spacing['3xl'] }}>
        <Text style={[theme.typography.headlineLarge, { color: theme.colors.textPrimary, textAlign: 'center', lineHeight: 34, marginBottom: theme.spacing.md }]}>
          {t('paywall.title')}
        </Text>
        <Text style={[theme.typography.bodyMedium, { color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 24 }]}>
          {t('paywall.subtitle')}
        </Text>
      </View>

      {/* 체험 배너 */}
      <TouchableOpacity
        style={[styles.trialBanner, {
          backgroundColor: theme.colors.primarySubtle,
          borderRadius: theme.borderRadius.lg,
          borderColor: theme.colors.primary,
        }]}
        onPress={() => navigation.replace('Subscription')}
      >
        <View style={[styles.trialBadge, { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.sm }]}>
          <Text style={[theme.typography.labelSmall, { color: theme.colors.onPrimary }]}>{t('paywall.recommended')}</Text>
        </View>
        <Text style={[theme.typography.titleMedium, { color: theme.colors.primary, marginBottom: theme.spacing.xs }]}>
          {t('paywall.trialTitle')}
        </Text>
        <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: theme.spacing.xs }]}>
          {t('paywall.trialDesc')}
        </Text>
        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, textAlign: 'center' }]}>
          {t('paywall.trialNote')}
        </Text>
      </TouchableOpacity>

      {/* 구분선 */}
      <View style={[styles.divider, { marginVertical: theme.spacing.xl }]}>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, paddingHorizontal: theme.spacing.md }]}>
          {t('paywall.orSubscribe')}
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
      </View>

      {/* 플랜 카드 */}
      <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing['2xl'] }}>
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.tier}
            style={[
              styles.planCard,
              {
                backgroundColor: plan.highlight ? theme.colors.primarySubtle : theme.colors.surface,
                borderColor: plan.highlight ? theme.colors.primary : theme.colors.border,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
            onPress={() => navigation.replace('Subscription')}
          >
            <View style={styles.planHeader}>
              <Text style={[
                theme.typography.titleMedium,
                { color: plan.highlight ? theme.colors.primary : theme.colors.textPrimary },
              ]}>
                {plan.label}
              </Text>
              <Text style={[
                theme.typography.titleSmall,
                { color: plan.highlight ? theme.colors.primary : theme.colors.textSecondary },
              ]}>
                {plan.price}
              </Text>
            </View>
            {plan.benefits.map((benefit) => (
              <Text key={benefit} style={[
                theme.typography.bodySmall,
                { color: plan.highlight ? theme.colors.primary : theme.colors.textSecondary, lineHeight: 22 },
              ]}>
                {'  '}{benefit}
              </Text>
            ))}
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA */}
      <Button
        label={t('paywall.viewPlans')}
        variant="primary"
        size="lg"
        fullWidth
        onPress={() => navigation.replace('Subscription')}
      />
      <View style={{ marginTop: theme.spacing.md }}>
        <Button
          label={t('paywall.later')}
          variant="ghost"
          fullWidth
          onPress={() => navigation.goBack()}
        />
      </View>

      <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, textAlign: 'center', marginTop: theme.spacing.lg }]}>
        {t('paywall.diaryStillSaved')}
      </Text>
    </ScreenContainer>
  );
}

export default PaywallScreenV2;

const styles = StyleSheet.create({
  trialBanner: {
    padding: 20,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  trialBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  planCard: {
    padding: 18,
    borderWidth: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
});
