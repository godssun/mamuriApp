/**
 * Design System v3 — Color Tokens
 *
 * Visual direction: warm paper / scrapbook / editorial journal
 * Extracted from 4 reference screens (Welcome, Sticker Drawer, Monthly Archive, Editor)
 */

// ============================================================
// Primitive Palette — Raw values (use semantic tokens in UI)
// ============================================================
export const palette = {
  // Paper & Background
  paperBase: '#EBE5DF',
  paperWarm: '#F2EBE3',
  paperCream: '#F4EFEA',
  paperIvory: '#FDFCF8',
  cardWhite: '#FAF8F5',
  pureWhite: '#FFFFFF',

  // Text
  inkDark: '#3E342F',
  inkDarkAlt: '#3E312B',
  inkMuted: '#8A7A71',
  inkMutedAlt: '#827873',
  inkFaint: '#C4B9B1',

  // Sage / Nature greens
  sageGreen: '#9CAD98',
  sageLight: '#C4CEC0',
  sageMuted: '#B4B9A6',
  olive: '#9A9E81',

  // Lavender
  lavender: '#B8B0C6',
  lavenderLight: '#D4CDDE',

  // Warm accents
  terra: '#C18C74',
  sand: '#D4C3B3',
  dustyRose: '#D9A7A7',
  mustard: '#D9B382',
  blush: '#E6C5C5',
  dustyBlue: '#A9B7C0',
} as const;

// ============================================================
// Emotion / Mood Blob Colors
// ============================================================
export const scrapbookMoodColors = {
  warmth: palette.terra,
  calm: palette.sageMuted,
  melancholy: palette.dustyBlue,
  tenderness: palette.dustyRose,
  joy: palette.mustard,
  growth: palette.olive,
  softness: palette.blush,
} as const;

// ============================================================
// Semantic Tokens — Use these in components
// ============================================================
export const colors = {
  // Backgrounds
  bgBase: palette.paperBase,
  bgWarm: palette.paperWarm,
  bgCream: palette.paperCream,
  bgIvory: palette.paperIvory,

  // Surfaces (cards, sheets)
  surfaceCard: palette.cardWhite,
  surfacePure: palette.pureWhite,

  // Text
  textPrimary: palette.inkDark,
  textSecondary: palette.inkMuted,
  textTertiary: palette.inkFaint,

  // Brand accents
  accentPrimary: palette.sageGreen,
  accentPrimaryLight: palette.sageLight,
  accentSecondary: palette.lavender,
  accentSecondaryLight: palette.lavenderLight,

  // Warm accents
  accentTerra: palette.terra,
  accentSand: palette.sand,
  accentRose: palette.dustyRose,
  accentMustard: palette.mustard,
  accentBlush: palette.blush,
  accentDustyBlue: palette.dustyBlue,
  accentOlive: palette.olive,

  // Interactive
  buttonBorderDefault: palette.sageGreen,
  buttonBgHover: palette.sageGreen,
  buttonBgDark: palette.inkDark,
  buttonTextLight: palette.pureWhite,

  // Overlay & Glass
  overlayDim: 'rgba(62, 49, 43, 0.15)',
  overlayMedium: 'rgba(62, 49, 43, 0.30)',
  overlayHeavy: 'rgba(62, 49, 43, 0.50)',
  glassWhite: 'rgba(250, 248, 245, 0.85)',
  glassWhiteLight: 'rgba(255, 255, 255, 0.6)',
  glassBorder: 'rgba(255, 255, 255, 0.8)',
  glassBorderSubtle: 'rgba(255, 255, 255, 0.4)',

  // Tape
  tapePlain: 'rgba(255, 255, 255, 0.6)',
  tapeSand: 'rgba(212, 195, 179, 0.4)',
  tapeSage: 'rgba(180, 185, 166, 0.4)',

  // Tab bar
  tabBarBg: 'rgba(250, 248, 245, 0.9)',
  tabActive: palette.inkDark,
  tabInactive: palette.inkMuted,

  // Pill tab
  pillActiveBg: palette.pureWhite,
  pillActiveText: palette.inkDark,
  pillInactiveText: palette.inkMuted,
} as const;

export type ScrapbookColorTokens = typeof colors;
