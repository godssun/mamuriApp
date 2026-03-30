/**
 * Design System v3 — Animation Tokens
 *
 * Gentle, organic motion to match the paper/scrapbook aesthetic.
 * Slower and softer than typical app animations.
 */

// ============================================================
// Duration (ms)
// ============================================================
export const duration = {
  /** Fast micro-interactions (press feedback) */
  instant: 100,
  /** Standard transitions */
  fast: 200,
  /** Comfortable transitions (sheet open, tab switch) */
  normal: 300,
  /** Slow, deliberate animations (welcome, page turn) */
  slow: 500,
  /** Very slow (onboarding reveals) */
  gentle: 800,
} as const;

// ============================================================
// Easing
// ============================================================
export const easing = {
  /** Standard ease for most transitions */
  default: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  /** Ease out for enter animations */
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  /** Ease in for exit animations */
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Gentle spring-like ease */
  gentle: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// ============================================================
// Interaction Feedback
// ============================================================
export const feedback = {
  /** Press scale for buttons */
  pressScale: 0.98,
  /** Hover/press scale for sticker cells */
  stickerHoverScale: 1.05,
  /** Grab scale for draggable items */
  grabScale: 1.08,
} as const;
