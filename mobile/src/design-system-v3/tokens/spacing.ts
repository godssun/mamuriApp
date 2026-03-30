/**
 * Design System v3 — Spacing & Layout Tokens
 *
 * Grid: 4pt base with 8pt primary steps
 * Derived from reference screen measurements
 */

// ============================================================
// Spacing Scale
// ============================================================
export const spacing = {
  /** 2px */
  xxs: 2,
  /** 4px */
  xs: 4,
  /** 8px — compact gaps */
  sm: 8,
  /** 12px — list gaps, tab gaps */
  md: 12,
  /** 16px — card padding, section gaps */
  lg: 16,
  /** 20px — screen padding, medium gaps */
  xl: 20,
  /** 24px — large padding, sheet padding */
  '2xl': 24,
  /** 32px — major section spacing */
  '3xl': 32,
  /** 40px — welcome card padding */
  '4xl': 40,
  /** 48px — large separation */
  '5xl': 48,
  /** 60px — bottom margin, content top padding */
  '6xl': 60,
  /** 100px — welcome screen top offset */
  '7xl': 100,
} as const;

// ============================================================
// Layout Constants
// ============================================================
export const layout = {
  /** Screen horizontal padding */
  screenPaddingH: 24,
  /** Screen top safe area padding */
  screenPaddingTop: 56,
  /** Card internal padding horizontal */
  cardPaddingH: 32,
  /** Card internal padding vertical */
  cardPaddingV: 50,
  /** Card internal padding bottom */
  cardPaddingBottom: 40,
  /** Sheet header padding */
  sheetHeaderPaddingH: 20,
  /** Sticker grid gap */
  stickerGridGap: 16,
  /** Sticker grid column gap */
  stickerGridColGap: 12,
  /** Bottom sheet height ratio */
  bottomSheetHeightRatio: 0.65,
  /** Drag handle width */
  dragHandleWidth: 40,
  /** Drag handle height */
  dragHandleHeight: 4,
  /** Tab pill horizontal padding */
  pillPaddingH: 16,
  /** Tab pill vertical padding */
  pillPaddingV: 8,
  /** Touch target minimum */
  touchTarget: 44,
  /** Welcome card width */
  welcomeCardWidth: 310,
  /** Tape width default */
  tapeWidthDefault: 70,
  /** Tape height */
  tapeHeight: 22,
  /** Polaroid padding */
  polaroidPadding: 10,
  /** Polaroid bottom padding (larger) */
  polaroidPaddingBottom: 32,
  /** Mini polaroid size */
  miniPolaroidWidth: 44,
  /** Mini polaroid height */
  miniPolaroidHeight: 52,
  /** Sticker cell columns (grid) */
  stickerGridColumns: 4,
  /** Blob size */
  blobSize: 54,
  /** Floating tab bar bottom offset */
  floatingTabBarBottom: 24,
} as const;

export type SpacingKey = keyof typeof spacing;
