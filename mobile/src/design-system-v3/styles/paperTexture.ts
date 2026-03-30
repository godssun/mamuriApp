/**
 * Design System v3 — Paper Texture Styles
 *
 * Paper noise texture overlay configuration and container styles.
 * The noise effect requires react-native-svg for SVG feTurbulence.
 * Without it, a plain tinted overlay provides a simpler fallback.
 */

import { StyleSheet } from 'react-native';
import { paperNoise, zIndex } from '../tokens/textures';
import { colors } from '../tokens/colors';

/** SVG noise filter parameters — used by PaperBackground component */
export const noiseFilterConfig = {
  type: 'fractalNoise' as const,
  baseFrequency: paperNoise.baseFrequency,
  numOctaves: paperNoise.numOctaves,
  stitchTiles: 'stitch' as const,
  /** feColorMatrix values string for alpha-only noise */
  colorMatrixValues: `1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 ${paperNoise.alphaIntensity} 0`,
};

export const paperTextureStyles = StyleSheet.create({
  /** Full-screen noise overlay container */
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: paperNoise.overlayOpacity,
    zIndex: zIndex.paperTexture,
  },

  /** Paper-colored base background */
  baseBackground: {
    backgroundColor: colors.bgWarm,
  },

  /** Cream background variant */
  creamBackground: {
    backgroundColor: colors.bgCream,
  },

  /** Ivory background variant (lightest) */
  ivoryBackground: {
    backgroundColor: colors.bgIvory,
  },

  /** Fallback overlay when SVG is not available */
  fallbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(200, 190, 180, 0.03)',
    zIndex: zIndex.paperTexture,
  },
});
