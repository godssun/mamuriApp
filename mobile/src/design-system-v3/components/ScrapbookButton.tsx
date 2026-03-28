/**
 * ScrapbookButton — Primary action button
 *
 * Two variants:
 * - outline: sage green border, transparent bg (welcome screen)
 * - filled: dark bg, white text (sheet close, actions)
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { shadows } from '../tokens/shadows';
import { borderRadius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';
import { feedback } from '../tokens/animations';

type ButtonVariant = 'outline' | 'filled';

interface ScrapbookButtonProps {
  title: string;
  variant?: ButtonVariant;
  onPress: () => void;
  style?: ViewStyle;
}

export function ScrapbookButton({
  title,
  variant = 'outline',
  onPress,
  style,
}: ScrapbookButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={feedback.pressScale}
      style={[
        styles.base,
        variant === 'outline' ? styles.outline : styles.filled,
        style,
      ]}
    >
      <Text
        style={[
          variant === 'outline' ? styles.outlineText : styles.filledText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.buttonBorderDefault,
    borderRadius: borderRadius['2xl'],
    backgroundColor: 'rgba(253, 252, 248, 0.5)',
  },
  filled: {
    backgroundColor: colors.buttonBgDark,
    borderRadius: borderRadius.xl,
    ...shadows.crisp,
  },
  outlineText: {
    ...typography.labelLarge,
    color: colors.textPrimary,
  },
  filledText: {
    ...typography.labelMedium,
    color: colors.buttonTextLight,
  },
});
