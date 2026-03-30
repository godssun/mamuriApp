/**
 * PaperCard — Paper card with optional tape decoration
 *
 * Styled like a real paper card taped onto a page.
 * Slight rotation gives hand-placed feel.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { shadows, innerGlow } from '../tokens/shadows';
import { borderRadius } from '../tokens/radius';
import { layout } from '../tokens/spacing';
import { rotations } from '../tokens/textures';

interface PaperCardProps {
  rotation?: string;
  showTape?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
}

export function PaperCard({
  rotation = rotations.cardTiltCCW,
  showTape = true,
  style,
  children,
}: PaperCardProps) {
  return (
    <View
      style={[
        styles.card,
        { transform: [{ rotate: rotation }] },
        style,
      ]}
    >
      {showTape && <View style={styles.tape} />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.xs,
    paddingTop: layout.cardPaddingV,
    paddingHorizontal: layout.cardPaddingH,
    paddingBottom: layout.cardPaddingBottom,
    ...shadows.warm,
    ...innerGlow.cardInset,
  },
  tape: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    width: layout.tapeWidthDefault,
    height: layout.tapeHeight,
    backgroundColor: colors.tapePlain,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
    transform: [{ rotate: rotations.tapeTiltCW }],
    zIndex: 20,
  },
});
