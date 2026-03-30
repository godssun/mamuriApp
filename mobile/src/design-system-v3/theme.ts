/**
 * Design System v3 — Scrapbook Theme
 *
 * Unified theme object combining all tokens.
 * Designed to coexist with design-system-v2 during migration.
 */

import { colors, scrapbookMoodColors, palette } from './tokens/colors';
import { typography, fontFamily, buildFontAssets } from './tokens/typography';
import { spacing, layout } from './tokens/spacing';
import { shadows, innerGlow } from './tokens/shadows';
import { borderRadius } from './tokens/radius';
import { paperNoise, linedBackground, gridBackground, glassEffect, zIndex, rotations } from './tokens/textures';
import { duration, easing, feedback } from './tokens/animations';

export interface ScrapbookTheme {
  name: 'scrapbook';
  colors: typeof colors;
  palette: typeof palette;
  moodColors: typeof scrapbookMoodColors;
  typography: typeof typography;
  fontFamily: typeof fontFamily;
  spacing: typeof spacing;
  layout: typeof layout;
  shadows: typeof shadows;
  innerGlow: typeof innerGlow;
  borderRadius: typeof borderRadius;
  textures: {
    paperNoise: typeof paperNoise;
    linedBackground: typeof linedBackground;
    gridBackground: typeof gridBackground;
    glassEffect: typeof glassEffect;
  };
  zIndex: typeof zIndex;
  rotations: typeof rotations;
  duration: typeof duration;
  easing: typeof easing;
  feedback: typeof feedback;
}

export const scrapbookTheme: ScrapbookTheme = {
  name: 'scrapbook',
  colors,
  palette,
  moodColors: scrapbookMoodColors,
  typography,
  fontFamily,
  spacing,
  layout,
  shadows,
  innerGlow,
  borderRadius,
  textures: {
    paperNoise,
    linedBackground,
    gridBackground,
    glassEffect,
  },
  zIndex,
  rotations,
  duration,
  easing,
  feedback,
};

export { buildFontAssets };
