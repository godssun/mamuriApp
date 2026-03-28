/**
 * Design System v3 — Masking Tape Styles
 *
 * Translucent decorative tape elements.
 * Three variants: plain (white), sand (warm), sage (green).
 */

import { StyleSheet } from 'react-native';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';
import { rotations } from '../tokens/textures';

export const tapeStyles = StyleSheet.create({
  /** Base tape element */
  base: {
    height: layout.tapeHeight,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },

  /** Plain white/translucent tape */
  plain: {
    backgroundColor: colors.tapePlain,
    width: layout.tapeWidthDefault,
  },

  /** Sand-colored tape */
  sand: {
    backgroundColor: colors.tapeSand,
    width: 64,
  },

  /** Sage green tape */
  sage: {
    backgroundColor: colors.tapeSage,
    width: 56,
    height: 24,
  },

  /** Positioned at top-center of a card */
  topCenter: {
    position: 'absolute',
    top: -12,
    left: '50%',
    zIndex: 20,
  },
});

/** Tape rotation presets */
export const tapeRotations = {
  slight: rotations.tapeTiltCW,
  none: '0deg',
  opposite: '-2deg',
};
