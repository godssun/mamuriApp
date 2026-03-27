/**
 * CanvasObject — Unified draggable/resizable canvas object for photos and stickers
 *
 * - PanResponder for drag handling
 * - Tap to select: blue dashed border + 4 corner resize handles + action bar
 * - Bottom-right handle drag to resize (aspect ratio preserved)
 * - Supports photo and sticker types
 * - editable=false for read-only rendering (detail view)
 * - zIndex style applied per object
 */

import React, { useRef, useMemo } from 'react';
import {
  Animated, PanResponder, Image, View, TouchableOpacity,
  StyleSheet, Alert, ImageSourcePropType,
} from 'react-native';

export type CanvasObjectType = 'photo' | 'sticker';

export interface CanvasObjectData {
  id: string;
  type: CanvasObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  photoUri?: string;
  stickerCode?: string;
  stickerSource?: ImageSourcePropType;
}

interface CanvasObjectProps {
  data: CanvasObjectData;
  editable: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
  onDelete: (id: string) => void;
  onBringToFront?: (id: string) => void;
  onSendToBack?: (id: string) => void;
}

const HANDLE_SIZE = 12;
const HANDLE_HIT = 28;
const MIN_SIZE = 30;
const MAX_SIZE = 400;

export function CanvasObject({
  data,
  editable,
  selected,
  onSelect,
  onMove,
  onResize,
  onDelete,
  onBringToFront,
  onSendToBack,
}: CanvasObjectProps) {
  const { id, type, x, y, width, height, rotation, zIndex } = data;
  const aspectRatio = useRef(width / (height || 1)).current;

  const pan = useRef(new Animated.ValueXY({ x, y })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resizeStart = useRef({ w: width, h: height });

  // Sync pan position when data changes externally
  const lastDataPos = useRef({ x, y });
  if (lastDataPos.current.x !== x || lastDataPos.current.y !== y) {
    pan.setValue({ x, y });
    lastDataPos.current = { x, y };
  }

  const panResponder = useMemo(() => {
    if (!editable) return null;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3,
      onPanResponderGrant: () => {
        onSelect(id);
        pan.extractOffset();
        Animated.spring(scale, {
          toValue: 1.08,
          friction: 5,
          useNativeDriver: true,
        }).start();
        longPressTimer.current = setTimeout(() => {
          Alert.alert(
            type === 'photo' ? '사진 삭제' : '스티커 삭제',
            '이 항목을 삭제할까요?',
            [
              { text: '취소', style: 'cancel' },
              { text: '삭제', style: 'destructive', onPress: () => onDelete(id) },
            ],
          );
        }, 600);
      },
      onPanResponderMove: (_evt, gs) => {
        if (longPressTimer.current && (Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5)) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false },
        )(_evt, gs);
      },
      onPanResponderRelease: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }).start();
        pan.flattenOffset();
        const finalX = (pan.x as any)._value ?? x;
        const finalY = (pan.y as any)._value ?? y;
        onMove(id, finalX, finalY);
      },
    });
  }, [editable, id, onMove, onDelete, onSelect, type]);

  const resizePanResponder = useMemo(() => {
    if (!editable) return null;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        resizeStart.current = { w: width, h: height };
      },
      onPanResponderMove: (_evt, gs) => {
        const delta = (gs.dx + gs.dy) / 2;
        const newW = Math.max(MIN_SIZE, Math.min(MAX_SIZE, resizeStart.current.w + delta));
        const newH = type === 'sticker'
          ? newW
          : Math.max(MIN_SIZE, Math.min(MAX_SIZE, newW / aspectRatio));
        onResize(id, Math.round(newW), Math.round(newH));
      },
      onPanResponderRelease: () => {},
    });
  }, [editable, id, width, height, type, aspectRatio]);

  const imageSource = type === 'photo'
    ? { uri: data.photoUri }
    : data.stickerSource;

  if (!imageSource) return null;

  const animatedStyle = {
    transform: [
      { translateX: pan.x },
      { translateY: pan.y },
      ...(editable ? [{ scale }] : []),
      ...(rotation ? [{ rotate: `${rotation}deg` }] : []),
    ],
  };

  // Read-only mode
  if (!editable) {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            width,
            height,
            zIndex,
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              ...(rotation ? [{ rotate: `${rotation}deg` }] : []),
            ],
          },
        ]}
      >
        <Image
          source={imageSource}
          style={{ width, height, borderRadius: type === 'photo' ? 8 : 0 }}
          resizeMode={type === 'photo' ? 'cover' : 'contain'}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[styles.container, { width, height, zIndex: zIndex + 10 }, animatedStyle]}
      {...panResponder?.panHandlers}
    >
      <Image
        source={imageSource}
        style={{ width, height, borderRadius: type === 'photo' ? 8 : 0 }}
        resizeMode={type === 'photo' ? 'cover' : 'contain'}
      />

      {/* Selection UI */}
      {selected && (
        <>
          {/* Dashed border */}
          <View
            style={[
              styles.selectionBorder,
              { width: width + 4, height: height + 4 },
            ]}
            pointerEvents="box-none"
          >
            {/* Corner handles */}
            <View style={[styles.handle, styles.handleTL]} />
            <View style={[styles.handle, styles.handleTR]} />
            <View style={[styles.handle, styles.handleBL]} />
            {/* Bottom-right: draggable resize */}
            <View
              style={[styles.handleHit, styles.handleBR]}
              {...resizePanResponder?.panHandlers}
            >
              <View style={styles.handle} />
            </View>
          </View>

          {/* Action bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onDelete(id)}
            >
              <View style={styles.actionIcon}>
                <View style={{ width: 12, height: 1.5, backgroundColor: '#FF4444', borderRadius: 1 }} />
              </View>
            </TouchableOpacity>
            {onBringToFront && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onBringToFront(id)}
              >
                <View style={styles.actionIcon}>
                  <View style={{ width: 8, height: 8, borderWidth: 1.5, borderColor: '#4A90D9', borderRadius: 2 }} />
                  <View style={{ position: 'absolute', top: 2, left: 2, width: 8, height: 8, borderWidth: 1.5, borderColor: '#4A90D9', borderRadius: 2, backgroundColor: '#FFF' }} />
                </View>
              </TouchableOpacity>
            )}
            {onSendToBack && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onSendToBack(id)}
              >
                <View style={styles.actionIcon}>
                  <View style={{ position: 'absolute', top: 2, left: 2, width: 8, height: 8, borderWidth: 1.5, borderColor: '#999', borderRadius: 2, backgroundColor: '#FFF' }} />
                  <View style={{ width: 8, height: 8, borderWidth: 1.5, borderColor: '#999', borderRadius: 2 }} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
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
  actionBar: {
    position: 'absolute',
    bottom: -36,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
