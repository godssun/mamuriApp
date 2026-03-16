/**
 * MamuriApp Design System v2 — Typography Scale
 *
 * Based on: Apple HIG + Material Design 3 hybrid
 * Grid: 4pt baseline grid for line heights
 * Body size: 17pt (Apple HIG recommended default)
 * Min size: 11pt (Apple minimum)
 */

import { TextStyle, Platform } from 'react-native';

// ============================================================
// Font Families
// ============================================================
export const fontFamily = {
  /** System default — best readability */
  system: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  /** Serif for diary content */
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia',
  }),
  /** Monospace for technical display */
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
} as const;

// ============================================================
// Typography Scale
// ============================================================
export const typography = {
  // Display — Onboarding, empty states, hero text
  displayLarge: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.3,
  },

  // Headline — Screen titles, section headers
  headlineLarge: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  headlineMedium: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  headlineSmall: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },

  // Title — Card headings, subsection headers
  titleLarge: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0.1,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0.1,
  },

  // Body — Diary content, conversation text
  bodyLarge: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  bodyMedium: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },

  // Label — Buttons, tabs, chips, badges
  labelLarge: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0.3,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0.3,
  },

  // Caption — Timestamps, helper text
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0.2,
  },
} as const;

// ============================================================
// Font Scale Multipliers (Accessibility)
// ============================================================
export const fontScaleMultipliers = {
  small: 0.88,
  medium: 1.0,
  large: 1.12,
  extraLarge: 1.24,
} as const;

export type TypographyVariant = keyof typeof typography;
export type FontScaleKey = keyof typeof fontScaleMultipliers;
