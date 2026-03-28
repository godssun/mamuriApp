/**
 * Design System v3 — Lined / Grid Background Styles
 *
 * Provides configuration for notebook-style line backgrounds.
 * Since RN doesn't support CSS background-image gradients natively,
 * these are implemented as repeated thin View lines or SVG patterns
 * in the PaperBackground component.
 */

import { StyleSheet } from 'react-native';
import { linedBackground, gridBackground, zIndex } from '../tokens/textures';

/** Line rendering configuration */
export const lineConfig = {
  lined: {
    spacing: linedBackground.lineHeight,
    color: linedBackground.lineColor,
    colorMedium: linedBackground.lineColorMedium,
    thickness: linedBackground.lineWidth,
    direction: 'horizontal' as const,
  },
  grid: {
    spacing: gridBackground.cellSize,
    color: gridBackground.lineColor,
    thickness: gridBackground.lineWidth,
    direction: 'both' as const,
  },
} as const;

export const linedBackgroundStyles = StyleSheet.create({
  /** Container for line pattern overlay */
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: zIndex.linedBackground,
    overflow: 'hidden',
  },

  /** Individual horizontal line */
  horizontalLine: {
    height: linedBackground.lineWidth,
    backgroundColor: linedBackground.lineColor,
    width: '100%',
  },

  /** Individual vertical line (for grid) */
  verticalLine: {
    width: gridBackground.lineWidth,
    backgroundColor: gridBackground.lineColor,
    height: '100%',
    position: 'absolute',
  },
});
