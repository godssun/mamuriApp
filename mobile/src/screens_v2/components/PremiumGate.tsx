/**
 * PremiumGate — 프리미엄 기능 접근 게이트
 *
 * 프리미엄 기능에 접근할 때:
 * - 구독자: children 그대로 렌더링
 * - 비구독자: 잠금 오버레이 + 구독 유도 카드
 *
 * Usage:
 *   <PremiumGate feature="customSticker">
 *     <CustomStickerCreator />
 *   </PremiumGate>
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../design-system-v3';

type PremiumFeature =
  | 'customSticker'
  | 'premiumThemes'
  | 'premiumFonts'
  | 'advancedReports'
  | 'extendedAI';

interface PremiumGateProps {
  feature: PremiumFeature;
  children: React.ReactNode;
  /** 잠겼을 때 보여줄 대체 컨텐츠 (없으면 기본 잠금 카드 표시) */
  fallback?: React.ReactNode;
  /** inline 모드: 오버레이 대신 fallback만 표시 */
  inline?: boolean;
}

const FEATURE_CHECK: Record<PremiumFeature, (e: any) => boolean> = {
  customSticker: (e) => e.canCreateCustomSticker,
  premiumThemes: (e) => e.canUsePremiumThemes,
  premiumFonts: (e) => e.canUsePremiumFonts,
  advancedReports: (e) => e.canViewAdvancedReports,
  extendedAI: (e) => e.aiConversationDailyLimit > 3,
};

const FEATURE_LABEL_KEY: Record<PremiumFeature, string> = {
  customSticker: 'premium.customSticker',
  premiumThemes: 'premium.premiumThemes',
  premiumFonts: 'premium.premiumFonts',
  advancedReports: 'premium.advancedReports',
  extendedAI: 'premium.extendedAI',
};

export function PremiumGate({ feature, children, fallback, inline }: PremiumGateProps) {
  const { entitlements } = useSubscription();
  const { t } = useTranslation();
  const nav = useNavigation<any>();

  const hasAccess = FEATURE_CHECK[feature](entitlements);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (inline) {
    return (
      <TouchableOpacity
        style={styles.inlineLock}
        onPress={() => nav.navigate('Paywall')}
        activeOpacity={0.7}
      >
        <View style={styles.inlineProBadge}>
          <Text style={styles.inlineProText}>PRO</Text>
        </View>
        <Text style={styles.lockText}>{t('premium.unlockWith')}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.lockCard}>
        <View style={styles.proBadgeLarge}>
          <Text style={styles.proBadgeLargeText}>PRO</Text>
        </View>
        <Text style={styles.lockTitle}>{t('premium.featureLocked')}</Text>
        <Text style={styles.lockDesc}>{t('premium.subscribeToUnlock')}</Text>
        <TouchableOpacity
          style={styles.unlockBtn}
          onPress={() => nav.navigate('Paywall')}
          activeOpacity={0.7}
        >
          <Text style={styles.unlockBtnText}>{t('premium.viewPlans')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** 프리미엄 배지 — 잠긴 항목 옆에 표시 */
export function PremiumBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>PRO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  lockCard: {
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.sm,
    padding: spacing['2xl'],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...shadows.crisp,
    maxWidth: 280,
  },
  proBadgeLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentPrimary + '15',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing.md,
  },
  proBadgeLargeText: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 14,
    color: colors.accentPrimary,
    letterSpacing: 0.5,
  },
  lockTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  lockDesc: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  unlockBtn: {
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
  },
  unlockBtnText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 14,
    color: '#FFFFFF',
  },

  // Inline lock
  inlineLock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.accentPrimaryLight + '15',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.accentPrimary + '30',
  },
  inlineProBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accentPrimary + '20',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  inlineProText: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 7,
    color: colors.accentPrimary,
    letterSpacing: 0.3,
  },
  lockText: {
    fontFamily: fontFamily.sans,
    fontSize: 11,
    color: colors.accentPrimary,
  },

  // Badge
  badge: {
    backgroundColor: colors.accentPrimary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 8,
    color: colors.accentPrimary,
    letterSpacing: 0.5,
  },
});
