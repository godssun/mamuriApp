/**
 * Design System v3 — Scrapbook Element Styles
 *
 * Torn paper scraps, emotion blobs, sticker cells,
 * handwritten notes, postal stamps — the decorative language.
 */

import { StyleSheet } from 'react-native';
import { colors } from '../tokens/colors';
import { shadows } from '../tokens/shadows';
import { borderRadius } from '../tokens/radius';
import { layout } from '../tokens/spacing';
import { rotations } from '../tokens/textures';

// ============================================================
// Sticker / Emotion Blob Cell
// ============================================================
export const stickerCellStyles = StyleSheet.create({
  /** Grid cell for sticker items */
  cell: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },

  /** Hover/press state */
  cellPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});

/** Emotion blob shape variants (organic borderRadius) */
export const blobShapes = {
  shape1: { borderTopLeftRadius: 22, borderTopRightRadius: 32, borderBottomRightRadius: 38, borderBottomLeftRadius: 16 },
  shape2: { borderTopLeftRadius: 27, borderTopRightRadius: 27, borderBottomRightRadius: 16, borderBottomLeftRadius: 38 },
  shape3: { borderTopLeftRadius: 32, borderTopRightRadius: 22, borderBottomRightRadius: 27, borderBottomLeftRadius: 27 },
  shape4: { borderTopLeftRadius: 16, borderTopRightRadius: 38, borderBottomRightRadius: 27, borderBottomLeftRadius: 27 },
  shape5: { borderTopLeftRadius: 24, borderTopRightRadius: 30, borderBottomRightRadius: 22, borderBottomLeftRadius: 32 },
} as const;

export const blobStyles = StyleSheet.create({
  /** Base blob element */
  base: {
    width: layout.blobSize,
    height: layout.blobSize,
    opacity: 0.9,
    position: 'absolute',
  },
});

// ============================================================
// Torn Paper Scrap
// ============================================================
export const scrapStyles = StyleSheet.create({
  /** Torn paper scrap base */
  scrap: {
    width: 56,
    height: 56,
    backgroundColor: colors.surfacePure,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.crisp,
  },

  /** Narrow scrap variant */
  scrapNarrow: {
    width: 48,
    height: 60,
    backgroundColor: colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.crisp,
  },
});

// ============================================================
// Handwritten Note
// ============================================================
export const handwrittenStyles = StyleSheet.create({
  /** Handwritten accent text */
  note: {
    opacity: 0.7,
  },

  /** Signature style */
  signature: {
    paddingRight: 10,
  },
});

/** Common rotations for handwritten elements */
export const handwrittenRotations = {
  note: rotations.scrapNoteTilt,
  signature: rotations.signatureTilt,
  bgText: '2deg',
};

// ============================================================
// Postal Stamp
// ============================================================
export const postalStampStyles = StyleSheet.create({
  stamp: {
    width: 54,
    height: 54,
    opacity: 0.65,
  },
});

export const stampRotation = rotations.stampTilt;

// ============================================================
// Floating Card (Welcome card style)
// ============================================================
export const floatingCardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgIvory,
    width: layout.welcomeCardWidth,
    borderRadius: borderRadius.xs,
    paddingTop: layout.cardPaddingV,
    paddingHorizontal: layout.cardPaddingH,
    paddingBottom: layout.cardPaddingBottom,
    ...shadows.warm,
  },
});

export const floatingCardRotation = rotations.cardTiltCCW;
