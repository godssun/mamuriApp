/**
 * Design System v3 — Glass / Blur Sheet Styles
 *
 * Bottom sheet and overlay styles with glass-morphism effect.
 * Full backdrop-filter blur requires expo-blur (BlurView).
 * Without it, a semi-transparent background provides a usable fallback.
 */

import { StyleSheet } from 'react-native';
import { colors } from '../tokens/colors';
import { shadows } from '../tokens/shadows';
import { borderRadius } from '../tokens/radius';
import { spacing, layout } from '../tokens/spacing';
import { glassEffect, zIndex } from '../tokens/textures';

export const glassSheetStyles = StyleSheet.create({
  /** Dim overlay behind the sheet */
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlayDim,
    zIndex: zIndex.canvasOverlay,
  },

  /** Bottom sheet container */
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.glassWhite,
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    borderLeftWidth: 1,
    borderLeftColor: colors.glassBorderSubtle,
    borderRightWidth: 1,
    borderRightColor: colors.glassBorderSubtle,
    zIndex: zIndex.bottomSheet,
    ...shadows.float,
  },

  /** Sheet header area */
  header: {
    paddingTop: spacing.lg,
    paddingHorizontal: layout.sheetHeaderPaddingH,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },

  /** Drag handle indicator */
  dragHandle: {
    width: layout.dragHandleWidth,
    height: layout.dragHandleHeight,
    backgroundColor: 'rgba(138, 122, 113, 0.3)',
    borderRadius: borderRadius.xxs,
    marginBottom: spacing.xl,
  },

  /** Scrollable content area */
  scrollArea: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
  },

  /** Footer with gradient fade */
  footer: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
    alignItems: 'center',
  },
});

/** Blur configuration for expo-blur BlurView */
export const blurConfig = {
  sheet: {
    intensity: glassEffect.sheetBlurRadius * 5,
    tint: 'light' as const,
  },
  overlay: {
    intensity: glassEffect.overlayBlurRadius * 5,
    tint: 'dark' as const,
  },
};
