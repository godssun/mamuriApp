/**
 * DraggableSticker — Freely draggable sticker on diary canvas
 *
 * - PanResponder for drag handling
 * - Animated.ValueXY for position tracking
 * - Scale up + shadow while dragging
 * - Long press to delete
 * - editable=false for read-only (detail view)
 */

import React, { useRef, useMemo } from 'react';
import {
  Animated, PanResponder, Image, TouchableOpacity,
  StyleSheet, Alert, ImageSourcePropType,
} from 'react-native';

export interface DraggableStickerProps {
  id: string;
  stickerCode: string;
  stickerSource: ImageSourcePropType;
  initialX: number;
  initialY: number;
  size?: number;
  onPositionChange: (id: string, x: number, y: number) => void;
  onDelete?: (id: string) => void;
  editable?: boolean;
}

export function DraggableSticker({
  id,
  stickerSource,
  initialX,
  initialY,
  size = 60,
  onPositionChange,
  onDelete,
  editable = true,
}: DraggableStickerProps) {
  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const panResponder = useMemo(() => {
    if (!editable) return null;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Remember current offset
        pan.extractOffset();
        // Scale up
        Animated.spring(scale, {
          toValue: 1.15,
          friction: 5,
          useNativeDriver: true,
        }).start();
        // Start long press timer
        longPressTimer.current = setTimeout(() => {
          if (onDelete) {
            Alert.alert('스티커 삭제', '이 스티커를 삭제할까요?', [
              { text: '취소', style: 'cancel' },
              { text: '삭제', style: 'destructive', onPress: () => onDelete(id) },
            ]);
          }
        }, 600);
      },
      onPanResponderMove: (_evt, gestureState) => {
        // Cancel long press if finger moved
        if (longPressTimer.current && (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5)) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false },
        )(_evt, gestureState);
      },
      onPanResponderRelease: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        // Scale back
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }).start();
        // Flatten offset into value
        pan.flattenOffset();
        // Report final position
        const finalX = (pan.x as any)._value ?? initialX;
        const finalY = (pan.y as any)._value ?? initialY;
        onPositionChange(id, finalX, finalY);
      },
    });
  }, [editable, id, onPositionChange, onDelete]);

  const animatedStyle = {
    transform: [
      { translateX: pan.x },
      { translateY: pan.y },
      { scale },
    ],
  };

  if (!editable) {
    return (
      <Animated.View
        style={[
          styles.container,
          { width: size, height: size },
          { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
        ]}
      >
        <Image source={stickerSource} style={{ width: size, height: size }} resizeMode="contain" />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[styles.container, { width: size, height: size }, animatedStyle]}
      {...panResponder?.panHandlers}
    >
      <Image source={stickerSource} style={{ width: size, height: size }} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
});
