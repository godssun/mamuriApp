/**
 * RelationshipProgressBar — 7-stage companion relationship bar
 *
 * Visual progress bar showing relationship evolution stages
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontFamily } from '../../design-system-v3';

const STAGES = [
  { key: 1, label: '첫 만남' },
  { key: 2, label: '알아가기' },
  { key: 3, label: '친해지기' },
  { key: 4, label: '편안함' },
  { key: 5, label: '깊은 신뢰' },
  { key: 6, label: '소울메이트' },
  { key: 7, label: '영원한 친구' },
] as const;

interface RelationshipProgressBarProps {
  currentStage: number; // 1-7
  currentLevel: number;
  maxLevel: number;
}

export function RelationshipProgressBar({ currentStage, currentLevel, maxLevel }: RelationshipProgressBarProps) {
  const clampedStage = Math.max(1, Math.min(7, currentStage));
  const progress = ((clampedStage - 1) / 6) * 100;
  const stageInfo = STAGES[clampedStage - 1];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.stageLabel, { color: colors.accentPrimary }]}>
          {stageInfo.label}
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
        {STAGES.map((stage, i) => {
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
        <Text style={[styles.miniLabel, { color: colors.textTertiary }]}>{STAGES[0].label}</Text>
        <Text style={[styles.miniLabel, { color: colors.textTertiary }]}>{STAGES[3].label}</Text>
        <Text style={[styles.miniLabel, { color: colors.textTertiary }]}>{STAGES[6].label}</Text>
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
