/**
 * ScheduleScreenV3 — Warm scrapbook schedule
 *
 * "하루의 리듬을 조용히 함께 지켜주는 공간"
 *
 * Step 3 placeholder: the tab slot and skeleton only. Full MVP (monthly
 * view with emotion overlay, today list, create/edit bottom sheet,
 * diary linking, local notifications) lands in step 5.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  colors, fontFamily, shadows, spacing, borderRadius,
} from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';

export default function ScheduleScreenV3() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <PaperBackground variant="plain" color="cream">
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('schedule.title')}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderTitle}>{t('schedule.comingSoonTitle')}</Text>
            <Text style={styles.placeholderBody}>{t('schedule.comingSoonBody')}</Text>
          </View>
        </ScrollView>
      </View>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 22,
    color: colors.textPrimary,
  },
  scroll: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['3xl'],
    paddingBottom: 120,
  },
  placeholderCard: {
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.sm,
    padding: spacing['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...shadows.crisp,
    gap: spacing.md,
  },
  placeholderTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 18,
    color: colors.textPrimary,
  },
  placeholderBody: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
