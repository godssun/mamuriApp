/**
 * PillTabs — Category pill tab selector
 *
 * Horizontal scrollable tabs with pill shape.
 * Active tab has white background with subtle shadow.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '../tokens/colors';
import { shadows } from '../tokens/shadows';
import { borderRadius } from '../tokens/radius';
import { spacing, layout } from '../tokens/spacing';
import { typography } from '../tokens/typography';

interface PillTabsProps {
  tabs: string[];
  activeIndex: number;
  onTabPress: (index: number) => void;
}

export function PillTabs({ tabs, activeIndex, onTabPress }: PillTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {tabs.map((tab, index) => {
        const isActive = index === activeIndex;
        return (
          <TouchableOpacity
            key={tab}
            onPress={() => onTabPress(index)}
            activeOpacity={0.7}
            style={[styles.pill, isActive && styles.pillActive]}
          >
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  pill: {
    paddingHorizontal: layout.pillPaddingH,
    paddingVertical: layout.pillPaddingV,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: colors.pillActiveBg,
    borderColor: 'rgba(0, 0, 0, 0.02)',
    ...shadows.crisp,
  },
  pillText: {
    ...typography.labelMedium,
    color: colors.pillInactiveText,
  },
  pillTextActive: {
    color: colors.pillActiveText,
  },
});
