/**
 * Design System v3 — Polaroid Frame Styles
 *
 * Polaroid-style photo frame with bottom padding for caption area,
 * soft shadow, and slight rotation for hand-placed feel.
 */

import { StyleSheet } from 'react-native';
import { colors } from '../tokens/colors';
import { shadows } from '../tokens/shadows';
import { layout } from '../tokens/spacing';
import { rotations } from '../tokens/textures';

export const polaroidStyles = StyleSheet.create({
  /** Standard polaroid frame */
  frame: {
    backgroundColor: colors.surfacePure,
    padding: layout.polaroidPadding,
    paddingBottom: layout.polaroidPaddingBottom,
    ...shadows.soft,
  },

  /** Photo area inside the frame */
  photo: {
    width: '100%',
    aspectRatio: 1,
  },

  /** Caption text below photo */
  caption: {
    textAlign: 'center',
    marginTop: 6,
  },

  /** Mini polaroid variant */
  frameMini: {
    backgroundColor: colors.surfacePure,
    width: layout.miniPolaroidWidth,
    height: layout.miniPolaroidHeight,
    padding: 3,
    paddingBottom: 10,
    ...shadows.crisp,
  },

  /** Large polaroid variant */
  frameLarge: {
    backgroundColor: colors.surfacePure,
    padding: layout.polaroidPadding,
    paddingBottom: layout.polaroidPaddingBottom,
    width: 180,
    ...shadows.soft,
  },
});

/** Rotation presets for polaroid placement */
export const polaroidRotations = {
  slight: rotations.polaroidTiltCCW,
  opposite: rotations.polaroidTiltCW,
  none: '0deg',
};

/** Vintage photo effect values (for Image style or filter) */
export const vintagePhotoEffect = {
  /** Slight sepia warmth — apply via tintColor or overlay */
  overlayColor: 'rgba(180, 150, 120, 0.08)',
  /** Reduced contrast simulation */
  opacity: 0.92,
};
