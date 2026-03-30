/**
 * Design System v3 — Border Radius Tokens
 *
 * Rounder, softer radii reflecting scrapbook/paper aesthetic
 */

export const borderRadius = {
  /** 0px — Sharp (rarely used) */
  none: 0,
  /** 2px — Drag handle corners */
  xxs: 2,
  /** 4px — Paper card corners (like real paper) */
  xs: 4,
  /** 12px — Sticker cells, small cards */
  sm: 12,
  /** 16px — Medium cards */
  md: 16,
  /** 20px — Pill tabs, buttons */
  lg: 20,
  /** 24px — Rounded buttons */
  xl: 24,
  /** 30px — Start button, large pills */
  '2xl': 30,
  /** 32px — Bottom sheet top corners */
  '3xl': 32,
  /** 40px — Device container (preview) */
  '4xl': 40,
  /** 9999px — Full circle */
  full: 9999,
} as const;

export type BorderRadiusKey = keyof typeof borderRadius;
