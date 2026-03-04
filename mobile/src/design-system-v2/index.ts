/**
 * MamuriApp Design System v2 — Public API
 */

// Colors
export { palette, moodColors, lightColors, darkColors } from './colors';
export type { ColorTokens } from './colors';

// Typography
export { typography, fontFamily, fontScaleMultipliers } from './typography';
export type { TypographyVariant, FontScaleKey } from './typography';

// Spacing
export { spacing, layout } from './spacing';
export type { SpacingKey } from './spacing';

// Elevation & Shape
export { shadows, primaryShadow, borderRadius, darkSurfaceByElevation } from './elevation';
export type { ShadowLevel, BorderRadiusKey } from './elevation';

// Animation
export { duration, easing, springs, feedback } from './animations';

// Theme
export { lightTheme, darkTheme, createTheme } from './theme';
export type { Theme } from './theme';

// Context
export { ThemeProviderV2, useThemeV2 } from './ThemeContext';
