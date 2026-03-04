/**
 * MamuriApp Design System v2 — Spacing System
 *
 * Based on: 8pt grid with 4pt half-steps
 * Reference: Apple HIG, Material Design 3
 */

// ============================================================
// Spacing Scale (8pt grid)
// ============================================================
export const spacing = {
  /** 2px — Icon internal, micro adjustments */
  xxs: 2,
  /** 4px — Icon-text gap, minimal spacing */
  xs: 4,
  /** 8px — Compact padding, related element gap */
  sm: 8,
  /** 12px — List item gap, small card padding */
  md: 12,
  /** 16px — Default padding, card internal, section gap */
  lg: 16,
  /** 20px — Section padding, medium gap */
  xl: 20,
  /** 24px — Screen horizontal padding, large section gap */
  '2xl': 24,
  /** 32px — Major section spacing */
  '3xl': 32,
  /** 40px — Screen top/bottom padding */
  '4xl': 40,
  /** 48px — Large section separation */
  '5xl': 48,
  /** 64px — Page-level separation */
  '6xl': 64,
  /** 80px — Hero section spacing */
  '7xl': 80,
} as const;

// ============================================================
// Layout Constants
// ============================================================
export const layout = {
  /** Screen horizontal padding */
  screenPaddingH: 20,
  /** Screen top safe area padding */
  screenPaddingTop: 16,
  /** Card internal padding */
  cardPadding: 16,
  /** Card internal padding large */
  cardPaddingLg: 20,
  /** List item vertical gap */
  listGap: 12,
  /** Section vertical gap */
  sectionGap: 24,
  /** Input field height */
  inputHeight: 52,
  /** Button height */
  buttonHeight: 52,
  /** Button height small */
  buttonHeightSm: 40,
  /** Icon button size */
  iconButtonSize: 44,
  /** Tab bar height */
  tabBarHeight: 84,
  /** Avatar size small */
  avatarSm: 36,
  /** Avatar size medium */
  avatarMd: 48,
  /** Avatar size large */
  avatarLg: 64,
  /** Avatar size xlarge */
  avatarXl: 80,
  /** Touch target minimum (Apple HIG: 44pt) */
  touchTarget: 44,
  /** Max content width (readability) */
  maxContentWidth: 560,
  /** Bubble max width percentage */
  bubbleMaxWidth: 0.8,
} as const;

export type SpacingKey = keyof typeof spacing;
