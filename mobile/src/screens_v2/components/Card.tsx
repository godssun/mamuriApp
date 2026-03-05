/**
 * Design System v2 — Card Component
 *
 * Premium card with elevation, press animation, and variants.
 * Inspired by: Notion cards, Linear UI, Apple Health cards.
 */

import React, { useRef, useCallback } from 'react';
import {
  Animated,
  TouchableOpacity,
  View,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import { useThemeV2, ShadowLevel } from '../../design-system-v2';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  elevation?: ShadowLevel;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  onPress,
  elevation = 'sm',
  style,
  padding = 'md',
}: CardProps) {
  const { theme } = useThemeV2();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: theme.feedback.cardPressScale,
      ...theme.springs.snappy,
      useNativeDriver: true,
    }).start();
  }, [onPress, scaleAnim, theme]);

  const handlePressOut = useCallback(() => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...theme.springs.gentle,
      useNativeDriver: true,
    }).start();
  }, [onPress, scaleAnim, theme]);

  const paddingMap = {
    none: 0,
    sm: theme.spacing.md,
    md: theme.layout.cardPadding,
    lg: theme.layout.cardPaddingLg,
  };

  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: paddingMap[padding],
    ...theme.shadows[elevation],
  };

  const content = (
    <Animated.View style={[cardStyle, { transform: [{ scale: scaleAnim }] }, style]}>
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

/**
 * DiaryCard — Premium diary list card
 *
 * Design: Clean card with subtle accent bar, date, title, preview.
 * AI badge uses a pill shape with primary color.
 */
interface DiaryCardProps {
  moodColor?: string;
  date: string;
  title: string;
  preview: string;
  hasAIComment?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function DiaryCard({
  moodColor,
  date,
  title,
  preview,
  hasAIComment,
  onPress,
  style,
}: DiaryCardProps) {
  const { theme, isDark } = useThemeV2();

  return (
    <Card onPress={onPress} elevation="sm" padding="none" style={style}>
      <View style={styles.diaryCardInner}>
        {/* Mood accent bar */}
        {moodColor && (
          <View style={[
            styles.moodBar,
            {
              backgroundColor: moodColor,
              borderTopLeftRadius: theme.borderRadius.lg,
              borderBottomLeftRadius: theme.borderRadius.lg,
              opacity: isDark ? 0.7 : 0.9,
            },
          ]} />
        )}

        <View style={[styles.diaryContent, { padding: theme.layout.cardPadding }]}>
          {/* Top row: date + AI badge */}
          <View style={styles.topRow}>
            <Animated.Text style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary },
            ]}>
              {date}
            </Animated.Text>

            {hasAIComment && (
              <View style={[
                styles.aiBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(148, 136, 255, 0.12)'
                    : theme.colors.primarySubtle,
                  borderRadius: theme.borderRadius.full,
                },
              ]}>
                <Animated.Text style={[
                  styles.aiBadgeIcon,
                ]}>
                  💬
                </Animated.Text>
                <Animated.Text style={[
                  theme.typography.labelSmall,
                  { color: theme.colors.primary, fontSize: 10 },
                ]}>
                  AI
                </Animated.Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Animated.Text
            numberOfLines={1}
            style={[
              theme.typography.titleMedium,
              {
                color: theme.colors.textPrimary,
                marginTop: theme.spacing.xs,
                marginBottom: theme.spacing.xs,
              },
            ]}
          >
            {title}
          </Animated.Text>

          {/* Preview */}
          <Animated.Text
            numberOfLines={2}
            style={[
              theme.typography.bodySmall,
              {
                color: theme.colors.textSecondary,
                lineHeight: 19,
              },
            ]}
          >
            {preview}
          </Animated.Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  diaryCardInner: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  moodBar: {
    width: 4,
  },
  diaryContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 2,
  },
  aiBadgeIcon: {
    fontSize: 10,
  },
});
