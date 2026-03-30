/**
 * RelationshipProgressBar — 7-stage companion relationship bar
 *
 * Visual progress bar showing relationship evolution stages
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fontFamily } from '../../design-system-v3';

const STAGE_KEYS = [
  { key: 1, labelKey: 'relationship.firstMeeting' },
  { key: 2, labelKey: 'relationship.gettingToKnow' },
  { key: 3, labelKey: 'relationship.gettingCloser' },
  { key: 4, labelKey: 'relationship.comfort' },
  { key: 5, labelKey: 'relationship.deepTrust' },
  { key: 6, labelKey: 'relationship.soulmate' },
  { key: 7, labelKey: 'relationship.foreverFriend' },
] as const;

interface RelationshipProgressBarProps {
  currentStage: number; // 1-7
  currentLevel: number;
  maxLevel: number;
}

export function RelationshipProgressBar({ currentStage, currentLevel, maxLevel }: RelationshipProgressBarProps) {
  const { t } = useTranslation();
  const clampedStage = Math.max(1, Math.min(7, currentStage));
  const progress = ((clampedStage - 1) / 6) * 100;
  const stageInfo = STAGE_KEYS[clampedStage - 1];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.stageLabel, { color: colors.accentPrimary }]}>
          {t(stageInfo.labelKey)}
        </Text>
        <Text style={[styles.levelText, { color: colors.textTertiary }]}>
          Lv.{currentLevel}/{maxLevel}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.trackOuter, { backgroundColor: colors.accentSand + '20' }]}>
        <View
          style={[styles.trackFill, {
            backgroundColor: colors.accentPrimary,
            width: `${progress}%` as any,
          }]}
        />
        {/* Stage dots */}
        {STAGE_KEYS.map((stage, i) => {
          const dotPos = (i / 6) * 100;
          const isReached = i < clampedStage;
          return (
            <View
              key={stage.key}
              style={[
                styles.stageDot,
                {
                  left: `${dotPos}%` as any,
                  backgroundColor: isReached ? colors.accentPrimary : (colors.accentSand + '40'),
                  borderColor: isReached ? colors.accentPrimary : (colors.accentSand + '40'),
                },
              ]}
            />
          );
        })}
      </View>

      {/* Stage labels (first, middle, last) */}
      <View style={styles.labelsRow}>
        <Text style={[styles.miniLabel, { color: colors.textTertiary }]}>{t(STAGE_KEYS[0].labelKey)}</Text>
        <Text style={[styles.miniLabel, { color: colors.textTertiary }]}>{t(STAGE_KEYS[3].labelKey)}</Text>
        <Text style={[styles.miniLabel, { color: colors.textTertiary }]}>{t(STAGE_KEYS[6].labelKey)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  stageLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 14,
    fontWeight: '700',
  },
  levelText: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '500',
  },

  trackOuter: {
    height: 6, borderRadius: 3, position: 'relative', overflow: 'visible',
  },
  trackFill: { height: 6, borderRadius: 3 },
  stageDot: {
    position: 'absolute', top: -3,
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, marginLeft: -6,
  },

  labelsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 8,
  },
  miniLabel: {
    fontFamily: fontFamily.sans,
    fontSize: 9,
    letterSpacing: 0.3,
  },
});
