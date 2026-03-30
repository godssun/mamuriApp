/**
 * MamuriApp Design System v3 — Scrapbook Edition
 *
 * Public API for the warm paper / scrapbook / editorial journal design system.
 *
 * Usage:
 *   import { colors, typography, PaperBackground } from '@/design-system-v3';
 */

// ── Theme ──────────────────────────────────────────────────
export { scrapbookTheme, buildFontAssets } from './theme';
export type { ScrapbookTheme } from './theme';

// ── Tokens ─────────────────────────────────────────────────
export {
  palette,
  scrapbookMoodColors,
  colors,
  fontFamily,
  fontAssetNames,
  typography,
  shadows,
  innerGlow,
  spacing,
  layout,
  borderRadius,
  paperNoise,
  linedBackground,
  gridBackground,
  glassEffect,
  zIndex,
  rotations,
  duration,
  easing,
  feedback,
} from './tokens';

export { DIARY_FONT_OPTIONS } from './tokens';

export type {
  ScrapbookColorTokens,
  TypographyVariant,
  DiaryFontKey,
  ShadowLevel,
  SpacingKey,
  BorderRadiusKey,
} from './tokens';

// ── Styles ─────────────────────────────────────────────────
export {
  paperTextureStyles,
  noiseFilterConfig,
  linedBackgroundStyles,
  lineConfig,
  glassSheetStyles,
  blurConfig,
  polaroidStyles,
  polaroidRotations,
  vintagePhotoEffect,
  tapeStyles,
  tapeRotations,
  stickerCellStyles,
  blobShapes,
  blobStyles,
  scrapStyles,
  handwrittenStyles,
  handwrittenRotations,
  postalStampStyles,
  stampRotation,
  floatingCardStyles,
  floatingCardRotation,
} from './styles';

// ── Components ─────────────────────────────────────────────
export {
  PaperBackground,
  GlassBottomSheet,
  PillTabs,
  PaperCard,
  TapeDecoration,
  PolaroidFrame,
  FloatingTabBar,
  ScrapbookButton,
} from './components';
