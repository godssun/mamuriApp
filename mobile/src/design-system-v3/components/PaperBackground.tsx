/**
 * PaperBackground — Scrapbook paper texture wrapper
 *
 * Provides paper-colored background with optional lined/grid pattern.
 * When react-native-svg is available, renders noise texture overlay.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../tokens/colors';
import { linedBackground, gridBackground, zIndex } from '../tokens/textures';

type BackgroundVariant = 'plain' | 'lined' | 'grid';
type BackgroundColor = 'base' | 'warm' | 'cream' | 'ivory';

interface PaperBackgroundProps {
  variant?: BackgroundVariant;
  color?: BackgroundColor;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const bgColorMap: Record<BackgroundColor, string> = {
  base: colors.bgBase,
  warm: colors.bgWarm,
  cream: colors.bgCream,
  ivory: colors.bgIvory,
};

export function PaperBackground({
  variant = 'plain',
  color = 'warm',
  style,
  children,
}: PaperBackgroundProps) {
  const lines = useMemo(() => {
    if (variant === 'plain') return null;
    if (variant === 'lined') return <LinedOverlay />;
    return <GridOverlay />;
  }, [variant]);

  return (
    <View style={[styles.container, { backgroundColor: bgColorMap[color] }, style]}>
      {/* Subtle noise fallback */}
      <View style={styles.noiseOverlay} pointerEvents="none" />
      {lines}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

function LinedOverlay() {
  const lineCount = 40;
  return (
    <View style={styles.lineContainer} pointerEvents="none">
      {Array.from({ length: lineCount }, (_, i) => (
        <View
          key={i}
          style={[
            styles.line,
            { top: i * linedBackground.lineHeight },
          ]}
        />
      ))}
    </View>
  );
}

function GridOverlay() {
  const count = 30;
  return (
    <View style={styles.lineContainer} pointerEvents="none">
      {Array.from({ length: count }, (_, i) => (
        <React.Fragment key={i}>
          <View
            style={[
              styles.gridLineH,
              { top: i * gridBackground.cellSize },
            ]}
          />
          <View
            style={[
              styles.gridLineV,
              { left: i * gridBackground.cellSize },
            ]}
          />
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  noiseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(200, 190, 180, 0.03)',
    zIndex: zIndex.paperTexture,
  },
  lineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: zIndex.linedBackground,
    overflow: 'hidden',
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: linedBackground.lineWidth,
    backgroundColor: linedBackground.lineColor,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: gridBackground.lineWidth,
    backgroundColor: gridBackground.lineColor,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: gridBackground.lineWidth,
    backgroundColor: gridBackground.lineColor,
  },
  content: {
    flex: 1,
    zIndex: zIndex.content,
  },
});
