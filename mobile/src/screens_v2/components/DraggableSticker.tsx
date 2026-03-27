/**
 * DraggableSticker — Freely draggable sticker on diary canvas
 *
 * - PanResponder for drag handling
 * - Animated.ValueXY for position tracking
 * - Scale up + shadow while dragging
 * - Long press to delete
 * - Tap to select → resize handles (4 corners)
 * - Bottom-right handle drag to resize (30–120px)
 * - editable=false for read-only (detail view)
 */

import React, { useRef, useMemo, useState } from 'react';
import {
  Animated, PanResponder, Image, View,
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
  onSizeChange?: (id: string, newSize: number) => void;
  onDelete?: (id: string) => void;
  editable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

const MIN_SIZE = 30;
const MAX_SIZE = 120;
const HANDLE_SIZE = 12;
const HANDLE_HIT = 24;

export function DraggableSticker({
  id,
  stickerSource,
  initialX,
  initialY,
  size = 60,
  onPositionChange,
  onSizeChange,
  onDelete,
  editable = true,
  selected = false,
  onSelect,
}: DraggableStickerProps) {
  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resizeStartSize = useRef(size);

  const panResponder = useMemo(() => {
    if (!editable) return null;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Tap → select
        if (onSelect) onSelect(id);
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
  }, [editable, id, onPositionChange, onDelete, onSelect]);

  // Resize handle PanResponder (bottom-right corner)
  const resizePanResponder = useMemo(() => {
    if (!editable || !onSizeChange) return null;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        resizeStartSize.current = size;
      },
      onPanResponderMove: (_evt, gestureState) => {
        // Use diagonal distance for more natural resizing
        const delta = (gestureState.dx + gestureState.dy) / 2;
        const newSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, resizeStartSize.current + delta));
        onSizeChange(id, Math.round(newSize));
      },
      onPanResponderRelease: () => {},
    });
  }, [editable, id, size, onSizeChange]);

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

      {/* Selection border + resize handles */}
      {selected && (
        <View style={[styles.selectionBorder, { width: size + 4, height: size + 4 }]} pointerEvents="box-none">
          {/* Top-left handle */}
          <View style={[styles.handle, styles.handleTL]} />
          {/* Top-right handle */}
          <View style={[styles.handle, styles.handleTR]} />
          {/* Bottom-left handle */}
          <View style={[styles.handle, styles.handleBL]} />
          {/* Bottom-right handle — draggable for resize */}
          <View
            style={[styles.handleHit, styles.handleBR]}
            {...resizePanResponder?.panHandlers}
          >
            <View style={styles.handle} />
          </View>
        </View>
      )}
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
  selectionBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    borderWidth: 1.5,
    borderColor: '#4A90D9',
    borderRadius: 4,
    borderStyle: 'dashed',
  },
  handle: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#4A90D9',
  },
  handleHit: {
    width: HANDLE_HIT,
    height: HANDLE_HIT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleTL: {
    position: 'absolute',
    top: -(HANDLE_SIZE / 2),
    left: -(HANDLE_SIZE / 2),
  },
  handleTR: {
    position: 'absolute',
    top: -(HANDLE_SIZE / 2),
    right: -(HANDLE_SIZE / 2),
  },
  handleBL: {
    position: 'absolute',
    bottom: -(HANDLE_SIZE / 2),
    left: -(HANDLE_SIZE / 2),
  },
  handleBR: {
    position: 'absolute',
    bottom: -(HANDLE_HIT / 2),
    right: -(HANDLE_HIT / 2),
  },
});
