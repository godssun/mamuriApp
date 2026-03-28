/**
 * Design System v3 — Shadow & Elevation Tokens
 *
 * Shadow color base: warm brown (#3E342F / #3E312B)
 * Three tiers: crisp (subtle), soft (standard), float (elevated)
 */

import { ViewStyle } from 'react-native';

// ============================================================
// Shadow Presets
// ============================================================
export const shadows = {
  /** Level 0 — Flat */
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,

  /** Crisp — Subtle cards, input borders */
  crisp: {
    shadowColor: '#3E312B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  } as ViewStyle,

  /** Soft — Standard cards, paper cards, polaroids */
  soft: {
    shadowColor: '#3E312B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  } as ViewStyle,

  /** Warm — Welcome card, elevated paper */
  warm: {
    shadowColor: '#3E342F',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  } as ViewStyle,

  /** Float — Bottom sheet, floating elements */
  float: {
    shadowColor: '#3E312B',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  } as ViewStyle,

  /** Device — Phone container shadow (preview only) */
  device: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 12,
  } as ViewStyle,
} as const;

// ============================================================
// Inner glow — For card-cream inset effect
// ============================================================
export const innerGlow = {
  /** Simulated via border on cards */
  cardInset: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  } as ViewStyle,
} as const;

export type ShadowLevel = keyof typeof shadows;
