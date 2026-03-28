/**
 * Card v3 — Warm paper card component
 *
 * Ivory paper surface with soft shadow, scrapbook tone.
 * Press animation for interactive cards.
 *
 * v3 design system tokens. No react-native-svg.
 */

import React, { useRef, useCallback } from 'react';
import {
  Animated, TouchableOpacity, View, Text, ViewStyle, StyleSheet,
} from 'react-native';
import {
  colors, fontFamily, shadows, spacing, borderRadius, feedback,
} from '../../design-system-v3';

type CardElevation = 'none' | 'crisp' | 'soft' | 'warm';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  elevation?: CardElevation;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const elevationMap = {
  none: shadows.none,
  crisp: shadows.crisp,
  soft: shadows.soft,
  warm: shadows.warm,
};

// Keep backward compat with v2 elevation names
const legacyMap: Record<string, CardElevation> = {
  sm: 'crisp', md: 'soft', lg: 'warm', xl: 'warm', '2xl': 'warm',
};

const paddingMap = {
  none: 0,
  sm: spacing.md,
  md: spacing.lg,
  lg: spacing.xl,
};

export function Card({
  children, onPress, elevation = 'crisp', style, padding = 'md',
}: CardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Resolve legacy elevation names
  const resolvedElevation = legacyMap[elevation] || elevation;

  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: feedback.pressScale, tension: 300, friction: 10, useNativeDriver: true,
    }).start();
  }, [onPress]);

  const handlePressOut = useCallback(() => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1, tension: 200, friction: 12, useNativeDriver: true,
    }).start();
  }, [onPress]);

  const cardStyle: ViewStyle = {
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.sm,
    padding: paddingMap[padding],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...elevationMap[resolvedElevation],
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
 * DiaryCard — Scrapbook diary list card (legacy compat)
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
  moodColor, date, title, preview, hasAIComment, onPress, style,
}: DiaryCardProps) {
  return (
    <Card onPress={onPress} elevation="crisp" padding="none" style={style}>
      <View style={dc.inner}>
        {moodColor && (
          <View style={[dc.moodBar, { backgroundColor: moodColor, opacity: 0.9 }]} />
        )}
        <View style={dc.content}>
          <View style={dc.topRow}>
            <Text style={dc.date}>{date}</Text>
            {hasAIComment && (
              <View style={dc.aiBadge}>
                <View style={dc.aiDot} />
                <Text style={dc.aiText}>AI</Text>
              </View>
            )}
          </View>
          <Text numberOfLines={1} style={dc.title}>{title}</Text>
          <Text numberOfLines={2} style={dc.preview}>{preview}</Text>
        </View>
      </View>
    </Card>
  );
}

const dc = StyleSheet.create({
  inner: { flexDirection: 'row', overflow: 'hidden' },
  moodBar: {
    width: 4,
    borderTopLeftRadius: borderRadius.sm,
    borderBottomLeftRadius: borderRadius.sm,
  },
  content: { flex: 1, padding: spacing.lg },
  topRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  date: {
    fontFamily: fontFamily.script, fontSize: 12, color: colors.textTertiary,
  },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.accentPrimaryLight + '30',
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: borderRadius.full, gap: 3,
  },
  aiDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accentPrimary },
  aiText: { fontFamily: fontFamily.sansMedium, fontSize: 10, color: colors.accentPrimary },
  title: {
    fontFamily: fontFamily.sansMedium, fontSize: 15, fontWeight: '600',
    color: colors.textPrimary, marginTop: spacing.xs, marginBottom: spacing.xs,
  },
  preview: {
    fontFamily: fontFamily.sans, fontSize: 13, lineHeight: 19,
    color: colors.textSecondary,
  },
});
