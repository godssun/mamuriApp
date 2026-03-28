/**
 * Design System v3 — Typography Tokens
 *
 * Font roles:
 * - Serif (Playfair Display): titles, editorial mood, greeting
 * - Sans (Inter): body text, UI labels, high readability
 * - Script (Caveat): handwritten accents, signatures, decorative notes
 *
 * RN font loading: These fonts must be loaded via expo-font or asset linking.
 */

import { TextStyle, Platform } from 'react-native';

// ============================================================
// Font Families
// ============================================================
export const fontFamily = {
  /** Serif — editorial, emotional titles */
  serif: Platform.select({
    ios: 'PlayfairDisplay-Regular',
    android: 'PlayfairDisplay-Regular',
    default: 'PlayfairDisplay-Regular',
  }),
  serifItalic: Platform.select({
    ios: 'PlayfairDisplay-Italic',
    android: 'PlayfairDisplay-Italic',
    default: 'PlayfairDisplay-Italic',
  }),
  serifMedium: Platform.select({
    ios: 'PlayfairDisplay-Medium',
    android: 'PlayfairDisplay-Medium',
    default: 'PlayfairDisplay-Medium',
  }),

  /** Sans — UI, body, readability */
  sans: Platform.select({
    ios: 'Inter-Regular',
    android: 'Inter-Regular',
    default: 'Inter-Regular',
  }),
  sansLight: Platform.select({
    ios: 'Inter-Light',
    android: 'Inter-Light',
    default: 'Inter-Light',
  }),
  sansMedium: Platform.select({
    ios: 'Inter-Medium',
    android: 'Inter-Medium',
    default: 'Inter-Medium',
  }),
  sansSemiBold: Platform.select({
    ios: 'Inter-SemiBold',
    android: 'Inter-SemiBold',
    default: 'Inter-SemiBold',
  }),

  /** Script — handwritten accents, decorative */
  script: Platform.select({
    ios: 'Caveat-Regular',
    android: 'Caveat-Regular',
    default: 'Caveat-Regular',
  }),
  scriptMedium: Platform.select({
    ios: 'Caveat-Medium',
    android: 'Caveat-Medium',
    default: 'Caveat-Medium',
  }),

  /** System fallback — when custom fonts not loaded */
  systemDefault: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  systemSerif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia',
  }),
} as const;

// ============================================================
// Font asset map — for expo-font loading
// Place .ttf files in mobile/assets/fonts/ and uncomment below.
// Download from Google Fonts: Playfair Display, Inter, Caveat
// ============================================================
export const fontAssetNames = [
  'PlayfairDisplay-Regular',
  'PlayfairDisplay-Italic',
  'PlayfairDisplay-Medium',
  'Inter-Light',
  'Inter-Regular',
  'Inter-Medium',
  'Inter-SemiBold',
  'Caveat-Regular',
  'Caveat-Medium',
] as const;

/**
 * Build font assets map for useFonts() / Font.loadAsync().
 * Usage:
 *   import { buildFontAssets } from './typography';
 *   const fonts = buildFontAssets();
 *   const [loaded] = useFonts(fonts);
 *
 * Returns empty object if font files are not yet available.
 */
export function buildFontAssets(): Record<string, any> {
  try {
    return {
      'PlayfairDisplay-Regular': require('../../../assets/fonts/PlayfairDisplay-Regular.ttf'),
      'PlayfairDisplay-Italic': require('../../../assets/fonts/PlayfairDisplay-Italic.ttf'),
      'PlayfairDisplay-Medium': require('../../../assets/fonts/PlayfairDisplay-Medium.ttf'),
      'Inter-Light': require('../../../assets/fonts/Inter-Light.ttf'),
      'Inter-Regular': require('../../../assets/fonts/Inter-Regular.ttf'),
      'Inter-Medium': require('../../../assets/fonts/Inter-Medium.ttf'),
      'Inter-SemiBold': require('../../../assets/fonts/Inter-SemiBold.ttf'),
      'Caveat-Regular': require('../../../assets/fonts/Caveat-Regular.ttf'),
      'Caveat-Medium': require('../../../assets/fonts/Caveat-Medium.ttf'),
    };
  } catch {
    // Font files not yet downloaded — use system fallbacks
    return {};
  }
}

// ============================================================
// Typography Scale
// ============================================================
export const typography = {
  // Display — Welcome greeting, hero text
  displayLarge: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 28,
    lineHeight: 39,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: -0.56,
  },

  // Headline — Screen titles, month titles
  headlineLarge: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 26,
    lineHeight: 36,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: -0.52,
  },
  headlineMedium: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 22,
    lineHeight: 31,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: -0.44,
  },

  // Title — Section headers, card titles
  titleLarge: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0.1,
  },

  // Body — Diary content, descriptions
  bodyLarge: {
    fontFamily: fontFamily.sans,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: fontFamily.sans,
    fontSize: 13.5,
    lineHeight: 25.5,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0.14,
  },
  bodySmall: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0.2,
  },

  // Label — Buttons, tabs, chips
  labelLarge: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  labelMedium: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0.3,
  },
  labelSmall: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0.3,
  },

  // Script — Handwritten accents, signatures, decorative
  scriptLarge: {
    fontFamily: fontFamily.script,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  scriptMedium: {
    fontFamily: fontFamily.script,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  scriptSmall: {
    fontFamily: fontFamily.script,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },

  // Caption — Timestamps, tiny labels
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0.2,
  },
} as const;

export type TypographyVariant = keyof typeof typography;
