/**
 * MamuriApp Design System v2 — Color Tokens
 *
 * Design Direction: AI Companion Style
 * - Primary: Indigo/Lavender (trust + introspection)
 * - Secondary: Warm Rose (empathy + comfort)
 * - Accent: Amber (encouragement + energy)
 * - Neutrals: Warm grays (soft, not clinical)
 *
 * Inspired by: Calm, Headspace, Reflectly, Linear
 */

// ============================================================
// Primitive Palette — Raw color values (never use directly in UI)
// ============================================================
export const palette = {
  // Primary: Warm Indigo/Lavender
  indigo50: '#F0EEFF',
  indigo100: '#DCD8FF',
  indigo200: '#B8B0FF',
  indigo300: '#9488FF',
  indigo400: '#7B6CF0',
  indigo500: '#6356D9',
  indigo600: '#4E43B0',
  indigo700: '#3A3288',
  indigo800: '#272260',
  indigo900: '#151338',

  // Secondary: Warm Rose/Coral
  rose50: '#FFF1F0',
  rose100: '#FFD9D6',
  rose200: '#FFB3AD',
  rose300: '#FF8D84',
  rose400: '#F0706A',
  rose500: '#D95A55',
  rose600: '#B04540',
  rose700: '#88332E',
  rose800: '#60221F',
  rose900: '#381210',

  // Accent: Warm Amber
  amber50: '#FFF8E8',
  amber100: '#FFEFC4',
  amber200: '#FFE49D',
  amber300: '#FFD876',
  amber400: '#F0C85E',
  amber500: '#D9B34A',
  amber600: '#B08F38',
  amber700: '#886C28',
  amber800: '#604A1A',
  amber900: '#382A0E',

  // Neutrals: Warm grays
  neutral0: '#FFFFFF',
  neutral50: '#FAFAF8',
  neutral100: '#F5F4F0',
  neutral200: '#ECEAE4',
  neutral300: '#DDDBD4',
  neutral400: '#B8B5AD',
  neutral500: '#918E86',
  neutral600: '#6E6B64',
  neutral700: '#4D4A44',
  neutral800: '#302E2A',
  neutral900: '#1C1B18',
  neutral950: '#111110',

  // Semantic raw
  green400: '#4CAF7D',
  green500: '#3D9E6E',
  amber400s: '#F0A830',
  red400: '#E05454',
  red500: '#D04444',
  blue400: '#5B8DEF',
  blue500: '#4B7DD9',
} as const;

// ============================================================
// Mood Colors — Emotion-specific palette
// ============================================================
export const moodColors = {
  happy: '#FFD166',
  calm: '#83C9A8',
  sad: '#7BA7D9',
  anxious: '#E8A87C',
  angry: '#E07A7A',
  grateful: '#A8D5BA',
  tired: '#B8B0C8',
  excited: '#FF9B7A',
} as const;

// ============================================================
// Light Theme — Semantic Tokens
// ============================================================
export const lightColors = {
  // Backgrounds
  background: palette.neutral50, // #FAFAF8
  backgroundElevated: palette.neutral0, // #FFFFFF
  backgroundSubtle: palette.neutral100, // #F5F4F0

  // Surfaces (cards, modals)
  surface: palette.neutral0, // #FFFFFF
  surfaceSecondary: palette.neutral100, // #F5F4F0
  surfaceTertiary: palette.neutral200, // #ECEAE4

  // Primary action
  primary: palette.indigo500, // #6356D9
  primaryHover: palette.indigo600, // #4E43B0
  primaryLight: palette.indigo100, // #DCD8FF
  primarySubtle: palette.indigo50, // #F0EEFF
  onPrimary: '#FFFFFF',

  // Secondary (empathy-related UI)
  secondary: palette.rose400, // #F0706A
  secondaryLight: palette.rose100, // #FFD9D6
  secondarySubtle: palette.rose50, // #FFF1F0
  onSecondary: '#FFFFFF',

  // Accent (streaks, achievements)
  accent: palette.amber500, // #D9B34A
  accentLight: palette.amber100, // #FFEFC4
  accentSubtle: palette.amber50, // #FFF8E8
  onAccent: palette.neutral900, // #1C1B18

  // Text
  textPrimary: palette.neutral900, // #1C1B18
  textSecondary: palette.neutral600, // #6E6B64
  textTertiary: palette.neutral500, // #918E86
  textDisabled: palette.neutral400, // #B8B5AD
  textInverse: palette.neutral0, // #FFFFFF

  // Borders & Dividers
  border: palette.neutral200, // #ECEAE4
  borderSubtle: palette.neutral100, // #F5F4F0
  borderFocus: palette.indigo400, // #7B6CF0
  divider: palette.neutral200, // #ECEAE4

  // State colors
  success: palette.green400,
  successSubtle: '#EDFAF2',
  warning: palette.amber400s,
  warningSubtle: palette.amber50,
  error: palette.red400,
  errorSubtle: '#FFF0F0',
  info: palette.blue400,
  infoSubtle: '#EEF4FF',

  // AI Companion
  aiBubbleBg: palette.indigo50, // #F0EEFF
  aiBubbleText: palette.neutral800, // #302E2A
  userBubbleBg: palette.indigo500, // #6356D9
  userBubbleText: '#FFFFFF',
  aiGlow: 'rgba(99, 86, 217, 0.08)',

  // Interactive states
  pressed: 'rgba(0, 0, 0, 0.06)',
  ripple: 'rgba(99, 86, 217, 0.12)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  overlayHeavy: 'rgba(0, 0, 0, 0.6)',

  // Tab bar
  tabBarBg: palette.neutral0,
  tabBarBorder: palette.neutral200,
  tabActive: palette.indigo500,
  tabInactive: palette.neutral400,
} as const;

// ============================================================
// Dark Theme — Semantic Tokens
// ============================================================
export const darkColors = {
  // Backgrounds
  background: '#0F0F14',
  backgroundElevated: '#1A1A24',
  backgroundSubtle: '#14141C',

  // Surfaces
  surface: '#1E1E2A',
  surfaceSecondary: '#252535',
  surfaceTertiary: '#2C2C3E',

  // Primary
  primary: palette.indigo300, // #9488FF
  primaryHover: palette.indigo200,
  primaryLight: '#2A2548',
  primarySubtle: '#1E1A38',
  onPrimary: '#0F0F14',

  // Secondary
  secondary: palette.rose300, // #FF8D84
  secondaryLight: '#3A2020',
  secondarySubtle: '#2A1A1A',
  onSecondary: '#0F0F14',

  // Accent
  accent: palette.amber300, // #FFD876
  accentLight: '#3A3018',
  accentSubtle: '#2A2418',
  onAccent: '#0F0F14',

  // Text
  textPrimary: '#EDEDF0',
  textSecondary: '#9898AC',
  textTertiary: '#686880',
  textDisabled: '#4A4A5E',
  textInverse: palette.neutral900,

  // Borders
  border: '#2A2A3A',
  borderSubtle: '#222232',
  borderFocus: palette.indigo400,
  divider: '#252538',

  // State
  success: '#5BC48A',
  successSubtle: '#1A2E22',
  warning: '#F0B840',
  warningSubtle: '#2E2818',
  error: '#F06868',
  errorSubtle: '#2E1A1A',
  info: '#6B9DF5',
  infoSubtle: '#1A2030',

  // AI Companion
  aiBubbleBg: '#1E1A38',
  aiBubbleText: '#EDEDF0',
  userBubbleBg: palette.indigo600,
  userBubbleText: '#FFFFFF',
  aiGlow: 'rgba(148, 136, 255, 0.12)',

  // Interactive
  pressed: 'rgba(255, 255, 255, 0.06)',
  ripple: 'rgba(148, 136, 255, 0.16)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayHeavy: 'rgba(0, 0, 0, 0.8)',

  // Tab bar
  tabBarBg: '#14141C',
  tabBarBorder: '#222232',
  tabActive: palette.indigo300,
  tabInactive: '#686880',
} as const;

// ============================================================
// Theme type — uses string to allow both light/dark values
// ============================================================
export type ColorTokens = {
  [K in keyof typeof lightColors]: string;
};
