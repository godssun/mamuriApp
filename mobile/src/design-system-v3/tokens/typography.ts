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
// Font Families — using @expo-google-fonts naming convention
// ============================================================
export const fontFamily = {
  /** Serif — editorial, emotional titles */
  serif: 'PlayfairDisplay_400Regular',
  serifItalic: 'PlayfairDisplay_400Regular_Italic',
  serifMedium: 'PlayfairDisplay_500Medium',

  /** Sans — UI, body, readability */
  sans: 'Inter_400Regular',
  sansLight: 'Inter_300Light',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',

  /** Script — handwritten accents, decorative */
  script: 'Caveat_400Regular',
  scriptMedium: 'Caveat_500Medium',

  /** 일기 본문 폰트 — 한국어 본문/손글씨 */
  diaryDefault: 'Inter_400Regular',
  diarySerif: 'GowunBatang_400Regular',
  diaryHandwriting: 'GowunDodum_400Regular',
  diaryPen: 'NanumPenScript_400Regular',

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

/**
 * 일기 작성용 폰트 옵션
 * Settings에서 사용자가 선택, DiaryPageRenderer에 적용
 */
export const DIARY_FONT_OPTIONS = [
  { key: 'default' as const, label: '기본 본문', font: 'Inter_400Regular', preview: '오늘 하루도 수고했어요', premium: false },
  { key: 'serif' as const, label: '고운 바탕', font: 'GowunBatang_400Regular', preview: '오늘 하루도 수고했어요', premium: false },
  { key: 'round' as const, label: '고운 돋움', font: 'GowunDodum_400Regular', preview: '오늘 하루도 수고했어요', premium: true },
  { key: 'pen' as const, label: '손글씨', font: 'NanumPenScript_400Regular', preview: '오늘 하루도 수고했어요', premium: true },
] as const;

export type DiaryFontKey = typeof DIARY_FONT_OPTIONS[number]['key'];

// ============================================================
// Font asset map — uses @expo-google-fonts packages
// ============================================================
export const fontAssetNames = [
  'PlayfairDisplay_400Regular',
  'PlayfairDisplay_400Regular_Italic',
  'PlayfairDisplay_500Medium',
  'Inter_300Light',
  'Inter_400Regular',
  'Inter_500Medium',
  'Inter_600SemiBold',
  'Caveat_400Regular',
  'Caveat_500Medium',
] as const;

/**
 * Build font assets map for useFonts().
 *
 * Usage:
 *   import { useFonts } from 'expo-font';
 *   import { buildFontAssets } from '@/design-system-v3';
 *   const [loaded] = useFonts(buildFontAssets());
 */
export function buildFontAssets(): Record<string, any> {
  return {
    PlayfairDisplay_400Regular: require('@expo-google-fonts/playfair-display/400Regular/PlayfairDisplay_400Regular.ttf'),
    PlayfairDisplay_400Regular_Italic: require('@expo-google-fonts/playfair-display/400Regular_Italic/PlayfairDisplay_400Regular_Italic.ttf'),
    PlayfairDisplay_500Medium: require('@expo-google-fonts/playfair-display/500Medium/PlayfairDisplay_500Medium.ttf'),
    Inter_300Light: require('@expo-google-fonts/inter/300Light/Inter_300Light.ttf'),
    Inter_400Regular: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
    Inter_500Medium: require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
    Inter_600SemiBold: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
    Caveat_400Regular: require('@expo-google-fonts/caveat/400Regular/Caveat_400Regular.ttf'),
    Caveat_500Medium: require('@expo-google-fonts/caveat/500Medium/Caveat_500Medium.ttf'),
    // 일기 작성용 한국어 폰트
    GowunBatang_400Regular: require('@expo-google-fonts/gowun-batang/400Regular/GowunBatang_400Regular.ttf'),
    GowunDodum_400Regular: require('@expo-google-fonts/gowun-dodum/400Regular/GowunDodum_400Regular.ttf'),
    NanumPenScript_400Regular: require('@expo-google-fonts/nanum-pen-script/400Regular/NanumPenScript_400Regular.ttf'),
  };
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
