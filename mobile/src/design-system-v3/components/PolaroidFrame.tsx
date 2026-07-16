/**
 * PolaroidFrame — Polaroid-style photo frame
 *
 * White border frame with larger bottom padding for caption.
 * Includes subtle shadow and optional rotation.
 */

import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';
import { colors } from '../tokens/colors';
import { shadows } from '../tokens/shadows';
import { layout } from '../tokens/spacing';
import { typography } from '../tokens/typography';
import { rotations } from '../tokens/textures';
import { vintagePhotoEffect } from '../styles/polaroid';

type PolaroidSize = 'sm' | 'md' | 'lg';

interface PolaroidFrameProps {
  imageSource: ImageSourcePropType;
  size?: PolaroidSize;
  rotation?: string;
  caption?: string;
  style?: ViewStyle;
}

const sizeMap: Record<PolaroidSize, { width: number; photoHeight: number }> = {
  sm: { width: layout.miniPolaroidWidth, photoHeight: 34 },
  md: { width: 120, photoHeight: 100 },
  lg: { width: 180, photoHeight: 160 },
};

export function PolaroidFrame({
  imageSource,
  size = 'md',
  rotation = rotations.polaroidTiltCCW,
  caption,
  style,
}: PolaroidFrameProps) {
  const dim = sizeMap[size];
  const padding = size === 'sm' ? 3 : layout.polaroidPadding;
  const paddingBottom = size === 'sm' ? 10 : layout.polaroidPaddingBottom;

  return (
    <View
      style={[
        styles.frame,
        {
          width: dim.width,
          padding,
          paddingBottom,
          transform: [{ rotate: rotation }],
        },
        style,
      ]}
    >
      <Image
        source={imageSource}
        style={[styles.photo, { height: dim.photoHeight }]}
        resizeMode="cover"
      />
      {/* Vintage warmth overlay */}
      <View style={styles.vintageOverlay} pointerEvents="none" />
      {caption && (
        <Text style={styles.caption} numberOfLines={1}>
          {caption}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.surfacePure,
    ...shadows.soft,
  },
  photo: {
    width: '100%',
    borderRadius: 1,
  },
  vintageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: vintagePhotoEffect.overlayColor,
  },
  caption: {
    ...typography.scriptSmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
