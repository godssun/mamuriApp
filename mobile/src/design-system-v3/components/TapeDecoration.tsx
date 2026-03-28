/**
 * TapeDecoration — Decorative masking tape element
 *
 * Three variants: plain (white), sand (warm), sage (green).
 * Used as decorative accents on cards, photos, and page elements.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';

type TapeVariant = 'plain' | 'sand' | 'sage';

interface TapeDecorationProps {
  variant?: TapeVariant;
  width?: number;
  rotation?: string;
  style?: ViewStyle;
}

const variantColors: Record<TapeVariant, string> = {
  plain: colors.tapePlain,
  sand: colors.tapeSand,
  sage: colors.tapeSage,
};

const variantWidths: Record<TapeVariant, number> = {
  plain: layout.tapeWidthDefault,
  sand: 64,
  sage: 56,
};

export function TapeDecoration({
  variant = 'plain',
  width,
  rotation = '0deg',
  style,
}: TapeDecorationProps) {
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: variantColors[variant],
          width: width ?? variantWidths[variant],
          height: variant === 'sage' ? 24 : layout.tapeHeight,
          transform: [{ rotate: rotation }],
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
});
