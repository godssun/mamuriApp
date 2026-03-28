/**
 * FloatingTabBar — Floating bottom navigation bar
 *
 * Glass-effect pill-shaped tab bar floating above content.
 * Matches the scrapbook design language.
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '../tokens/colors';
import { shadows } from '../tokens/shadows';
import { borderRadius } from '../tokens/radius';
import { spacing, layout } from '../tokens/spacing';
import { typography } from '../tokens/typography';

interface TabItem {
  label: string;
  icon?: React.ReactNode;
}

interface FloatingTabBarProps {
  tabs: TabItem[];
  activeIndex: number;
  onTabPress: (index: number) => void;
  style?: ViewStyle;
}

export function FloatingTabBar({
  tabs,
  activeIndex,
  onTabPress,
  style,
}: FloatingTabBarProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.bar}>
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          return (
            <TouchableOpacity
              key={tab.label}
              onPress={() => onTabPress(index)}
              activeOpacity={0.7}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              {tab.icon}
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: layout.floatingTabBarBottom,
    left: spacing['2xl'],
    right: spacing['2xl'],
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.tabBarBg,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    ...shadows.soft,
    borderWidth: 1,
    borderColor: colors.glassBorderSubtle,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  tabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  tabText: {
    ...typography.labelSmall,
    color: colors.tabInactive,
    marginTop: 2,
  },
  tabTextActive: {
    color: colors.tabActive,
  },
});
