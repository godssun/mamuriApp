/**
 * GlassBottomSheet — Glass-morphism bottom sheet
 *
 * Semi-transparent sheet with blur effect simulation.
 * Uses Animated API for slide-in animation.
 * For real backdrop blur, install expo-blur and wrap content in BlurView.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { colors } from '../tokens/colors';
import { shadows } from '../tokens/shadows';
import { borderRadius } from '../tokens/radius';
import { spacing, layout } from '../tokens/spacing';
import { glassEffect, zIndex } from '../tokens/textures';
import { duration } from '../tokens/animations';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface GlassBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  heightRatio?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlassBottomSheet({
  visible,
  onClose,
  heightRatio = layout.bottomSheetHeightRatio,
  children,
  style,
}: GlassBottomSheetProps) {
  const sheetHeight = SCREEN_HEIGHT * heightRatio;
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: duration.normal,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: duration.normal,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: sheetHeight,
          duration: duration.fast,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: duration.fast,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, sheetHeight]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheet,
          { height: sheetHeight, transform: [{ translateY }] },
          style,
        ]}
      >
        <View style={styles.header}>
          <View style={styles.dragHandle} />
        </View>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayDim,
    zIndex: zIndex.canvasOverlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.glassWhite,
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    borderLeftWidth: 1,
    borderLeftColor: colors.glassBorderSubtle,
    borderRightWidth: 1,
    borderRightColor: colors.glassBorderSubtle,
    zIndex: zIndex.bottomSheet,
    ...shadows.float,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  dragHandle: {
    width: layout.dragHandleWidth,
    height: layout.dragHandleHeight,
    backgroundColor: 'rgba(138, 122, 113, 0.3)',
    borderRadius: borderRadius.xxs,
  },
});
