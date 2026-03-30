/**
 * PaperBackground — Scrapbook paper texture wrapper
 *
 * Provides paper-colored background with optional lined/grid pattern.
 * When react-native-svg is available, renders noise texture overlay.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Image } from 'react-native';
import { colors } from '../tokens/colors';
import { linedBackground, gridBackground, zIndex } from '../tokens/textures';

/**
 * PRO 텍스처 테마 레이어 설계:
 *
 * Layer 1: 테마별 배경색 (DIARY_THEMES.color로 View 전체에 적용)
 * Layer 2: 텍스처 이미지 — 매우 낮은 opacity로 종이 질감만 암시
 * Layer 3: 색조 오버레이 — 테마 무드를 살리는 반투명 tint
 * Layer 4: 콘텐츠 — 텍스트 가독성 최우선
 */
const TEXTURE_THEMES: Record<string, { source: any; opacity: number }> = {
  crumpled1: { source: require('../../../assets/textures/crumpled_paper.png'), opacity: 0.35 },
  crumpled2: { source: require('../../../assets/textures/crumpled_plain.png'), opacity: 0.35 },
  crumpled3: { source: require('../../../assets/textures/crumpled_plain.png'), opacity: 0.25 },
};

type BackgroundVariant = 'plain' | 'lined' | 'grid';
type BackgroundColor = 'base' | 'warm' | 'cream' | 'ivory';

interface PaperBackgroundProps {
  variant?: BackgroundVariant;
  color?: BackgroundColor;
  /** 일기 테마 키 — PRO 텍스처 테마일 때 배경 이미지 적용 */
  themeKey?: string;
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
  themeKey,
  style,
  children,
}: PaperBackgroundProps) {
  const lines = useMemo(() => {
    if (variant === 'plain') return null;
    if (variant === 'lined') return <LinedOverlay />;
    return <GridOverlay />;
  }, [variant]);

  const texture = themeKey ? TEXTURE_THEMES[themeKey] : undefined;

  return (
    <View style={[styles.container, { backgroundColor: bgColorMap[color] }, style]}>
      {/* PRO 텍스처 배경 이미지 */}
      {texture && (
        <Image
          source={texture.source}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: texture.opacity,
          }}
          resizeMode="cover"
        />
      )}
      {/* Subtle noise fallback */}
      {!texture && <View style={styles.noiseOverlay} pointerEvents="none" />}
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
