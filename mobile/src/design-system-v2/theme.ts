/**
 * MamuriApp Design System v2 — Theme Composition
 *
 * Combines all tokens into a unified theme object.
 * Provides both light and dark theme presets.
 */

import { lightColors, darkColors, moodColors, ColorTokens } from './colors';
import { typography, fontFamily, fontScaleMultipliers, FontScaleKey } from './typography';
import { spacing, layout } from './spacing';
import { shadows, borderRadius, primaryShadow, darkSurfaceByElevation } from './elevation';
import { duration, easing, springs, feedback } from './animations';

// ============================================================
// Theme Structure
// ============================================================
export interface Theme {
  name: 'light' | 'dark';
  colors: ColorTokens;
  typography: typeof typography;
  fontFamily: typeof fontFamily;
  fontScale: number;
  spacing: typeof spacing;
  layout: typeof layout;
  shadows: typeof shadows;
  primaryShadow: typeof primaryShadow;
  borderRadius: typeof borderRadius;
  duration: typeof duration;
  easing: typeof easing;
  springs: typeof springs;
  feedback: typeof feedback;
  moodColors: typeof moodColors;
}

// ============================================================
// Theme Presets
// ============================================================
export const lightTheme: Theme = {
  name: 'light',
  colors: lightColors,
  typography,
  fontFamily,
  fontScale: fontScaleMultipliers.medium,
  spacing,
  layout,
  shadows,
  primaryShadow,
  borderRadius,
  duration,
  easing,
  springs,
  feedback,
  moodColors,
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: darkColors,
  typography,
  fontFamily,
  fontScale: fontScaleMultipliers.medium,
  spacing,
  layout,
  shadows: {
    // Dark mode: minimal shadows, rely on tonal elevation
    none: shadows.none,
    sm: { ...shadows.sm, shadowOpacity: 0 },
    md: { ...shadows.md, shadowOpacity: 0 },
    lg: { ...shadows.lg, shadowOpacity: 0.06 },
    xl: { ...shadows.xl, shadowOpacity: 0.1 },
    '2xl': { ...shadows['2xl'], shadowOpacity: 0.12 },
  },
  primaryShadow: { ...primaryShadow, shadowOpacity: 0.15 },
  borderRadius,
  duration,
  easing,
  springs,
  feedback,
  moodColors,
};

// ============================================================
// Helper: Create theme with custom font scale
// ============================================================
export function createTheme(
  base: 'light' | 'dark',
  fontScaleKey: FontScaleKey = 'medium',
): Theme {
  const theme = base === 'light' ? { ...lightTheme } : { ...darkTheme };
  theme.fontScale = fontScaleMultipliers[fontScaleKey];
  return theme;
}
