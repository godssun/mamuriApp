/**
 * EmotionStickerView — Shared sticker rendering component
 *
 * Renders emotion stickers consistently across all screens.
 * No circular clipping — assets have transparent backgrounds.
 */

import React from 'react';
import { View, Text, Image, ViewStyle, StyleSheet } from 'react-native';
import type { EmotionKey } from '../../types';
import { EMOTION_STICKER_IMAGES, EMOTION_LABELS } from '../../constants/stickers';

const SIZE_MAP = {
  hero: 80,
  large: 64,
  medium: 48,
  small: 32,
  mini: 24,
  tiny: 20,
} as const;

export type StickerSize = keyof typeof SIZE_MAP;

export interface EmotionStickerViewProps {
  emotionKey: EmotionKey;
  size: StickerSize;
  showLabel?: boolean;
  style?: ViewStyle;
}

export function EmotionStickerView({
  emotionKey,
  size,
  showLabel = false,
  style,
}: EmotionStickerViewProps) {
  const px = SIZE_MAP[size];

  return (
    <View style={[styles.container, style]}>
      <Image
        source={EMOTION_STICKER_IMAGES[emotionKey]}
        style={{ width: px, height: px, resizeMode: 'contain' }}
      />
      {showLabel && (
        <Text style={styles.label}>{EMOTION_LABELS[emotionKey]}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A8A8E',
    marginTop: 4,
    letterSpacing: -0.2,
  },
});
