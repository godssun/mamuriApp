/**
 * Design System v3 — Texture & Background Tokens
 *
 * Configuration values for paper noise, lined/grid backgrounds,
 * and glass/blur effects. These are constants used by style utilities
 * and components to maintain visual consistency.
 */

// ============================================================
// Paper Noise Texture (SVG feTurbulence)
// ============================================================
export const paperNoise = {
  /** feTurbulence baseFrequency */
  baseFrequency: 0.85,
  /** feTurbulence numOctaves */
  numOctaves: 3,
  /** feColorMatrix alpha channel value */
  alphaIntensity: 0.045,
  /** SVG overlay opacity */
  overlayOpacity: 0.4,
  /** Lighter variant for cards */
  overlayOpacityLight: 0.45,
} as const;

// ============================================================
// Lined Notebook Background
// ============================================================
export const linedBackground = {
  /** Line spacing in pixels */
  lineHeight: 28,
  /** Line color (very subtle) */
  lineColor: 'rgba(130, 120, 115, 0.06)',
  /** Alternative line color (slightly visible) */
  lineColorMedium: 'rgba(138, 122, 113, 0.08)',
  /** Line thickness */
  lineWidth: 1,
} as const;

// ============================================================
// Grid / Graph Paper Background
// ============================================================
export const gridBackground = {
  /** Grid cell size */
  cellSize: 32,
  /** Grid line color */
  lineColor: 'rgba(138, 122, 113, 0.06)',
  /** Grid line width */
  lineWidth: 1,
} as const;

// ============================================================
// Glass / Blur Effect
// ============================================================
export const glassEffect = {
  /** Backdrop blur radius for sheets */
  sheetBlurRadius: 20,
  /** Backdrop blur for tape/small elements */
  tapeBlurRadius: 2,
  /** Backdrop blur for overlay dim */
  overlayBlurRadius: 2,
  /** Glass background opacity */
  bgOpacity: 0.85,
} as const;

// ============================================================
// Z-Index Layering Convention
// ============================================================
export const zIndex = {
  /** Paper texture noise overlay */
  paperTexture: 0,
  /** Lined/grid background */
  linedBackground: 1,
  /** Background content (polaroids, text) */
  backgroundContent: 2,
  /** Main content layer */
  content: 10,
  /** Botanical / decorative art */
  decorativeArt: 15,
  /** Canvas overlay (dim) */
  canvasOverlay: 10,
  /** Tape decoration */
  tape: 20,
  /** Bottom sheet */
  bottomSheet: 20,
  /** Floating tab bar */
  floatingTabBar: 30,
  /** Modal overlay */
  modal: 50,
} as const;

// ============================================================
// Scrapbook Object Rotations
// ============================================================
export const rotations = {
  /** Slight CCW tilt for cards */
  cardTiltCCW: '-1deg',
  /** Slight CW tilt for tape */
  tapeTiltCW: '2deg',
  /** Polaroid tilt range */
  polaroidTiltCCW: '-4deg',
  polaroidTiltCW: '3deg',
  /** Signature tilt */
  signatureTilt: '-2deg',
  /** Scrap note tilt */
  scrapNoteTilt: '-10deg',
  /** Stamp tilt */
  stampTilt: '-12deg',
} as const;
