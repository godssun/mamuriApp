/**
 * MamuriApp Design System v2 — Animation Tokens
 *
 * Timing: Gentle and calm (diary/wellness app)
 * Physics: Spring-based for natural feel
 */

import { Easing } from 'react-native';

// ============================================================
// Duration Scale
// ============================================================
export const duration = {
  /** 100ms — Instant feedback (tap, toggle) */
  instant: 100,
  /** 200ms — Fast transition (fade, color change) */
  fast: 200,
  /** 300ms — Default transition (screen, card open) */
  normal: 300,
  /** 400ms — Smooth transition (modal, sheet) */
  smooth: 400,
  /** 600ms — Gentle transition (onboarding, emotion) */
  gentle: 600,
  /** 1000ms — Dramatic (level up, celebration) */
  dramatic: 1000,
} as const;

// ============================================================
// Easing Curves
// ============================================================
export const easing = {
  /** Standard ease in-out */
  standard: Easing.bezier(0.2, 0.0, 0, 1.0),
  /** Enter screen (decelerate) */
  decelerate: Easing.bezier(0.0, 0.0, 0, 1.0),
  /** Exit screen (accelerate) */
  accelerate: Easing.bezier(0.3, 0.0, 1, 1.0),
  /** Emphasis/bounce */
  emphasized: Easing.bezier(0.2, 0.0, 0, 1.0),
  /** Linear */
  linear: Easing.linear,
} as const;

// ============================================================
// Spring Configurations (for Animated.spring / Reanimated)
// ============================================================
export const springs = {
  /** Fast, snappy response (button press) */
  snappy: {
    damping: 15,
    stiffness: 400,
    mass: 0.8,
  },
  /** Smooth bounce (card transition) */
  gentle: {
    damping: 20,
    stiffness: 180,
    mass: 1,
  },
  /** Soft, lazy bounce (modal, sheet) */
  soft: {
    damping: 25,
    stiffness: 120,
    mass: 1.2,
  },
  /** Bouncy effect (level up, celebration) */
  bouncy: {
    damping: 10,
    stiffness: 200,
    mass: 0.8,
  },
} as const;

// ============================================================
// Interactive feedback
// ============================================================
export const feedback = {
  /** Press scale for buttons */
  pressScale: 0.97,
  /** Press scale for cards */
  cardPressScale: 0.985,
  /** Press opacity */
  pressOpacity: 0.85,
  /** Active opacity for TouchableOpacity */
  activeOpacity: 0.7,
} as const;
