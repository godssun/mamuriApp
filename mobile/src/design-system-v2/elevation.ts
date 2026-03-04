/**
 * MamuriApp Design System v2 — Elevation & Shadows
 *
 * Cross-platform: iOS shadowProps + Android elevation
 * Dark mode: Tonal elevation (surface brightness) instead of shadows
 */

import { ViewStyle } from 'react-native';

// ============================================================
// Shadow System (Light mode)
// ============================================================
export const shadows = {
  /** Level 0 — Flat elements */
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,

  /** Level 1 — Subtle cards (diary cards, input fields) */
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  } as ViewStyle,

  /** Level 2 — Standard cards (active cards, buttons) */
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  } as ViewStyle,

  /** Level 3 — Floating elements (FAB, dropdown) */
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  } as ViewStyle,

  /** Level 4 — Modal, bottom sheet */
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  } as ViewStyle,

  /** Level 5 — Top-level overlay, dragging state */
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
  } as ViewStyle,
} as const;

// ============================================================
// Primary-tinted shadows (for primary buttons, FAB)
// ============================================================
export const primaryShadow = {
  shadowColor: '#6356D9',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 6,
} as ViewStyle;

// ============================================================
// Dark Mode — Tonal Elevation (surface brightness)
// ============================================================
export const darkSurfaceByElevation = {
  level0: '#0F0F14',
  level1: '#1A1A24',
  level2: '#1E1E2A',
  level3: '#252535',
  level4: '#2C2C3E',
  level5: '#323245',
} as const;

// ============================================================
// Border Radius System
// ============================================================
export const borderRadius = {
  /** 0px — Sharp corners (rarely used) */
  none: 0,
  /** 4px — Tags, small badges */
  xs: 4,
  /** 8px — Buttons, input fields, small cards */
  sm: 8,
  /** 12px — Standard cards, conversation bubbles */
  md: 12,
  /** 16px — Large cards, image containers */
  lg: 16,
  /** 20px — Modals, bottom sheet top corners */
  xl: 20,
  /** 24px — Large containers, onboarding cards */
  '2xl': 24,
  /** 9999px — Full circle (avatars, pills) */
  full: 9999,
} as const;

export type ShadowLevel = keyof typeof shadows;
export type BorderRadiusKey = keyof typeof borderRadius;
