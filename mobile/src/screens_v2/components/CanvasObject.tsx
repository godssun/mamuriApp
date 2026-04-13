/**
 * CanvasObject — Unified draggable/resizable/rotatable canvas object
 *
 * Dual-layer architecture (editable mode):
 *   Visual layer: renders at object's real zIndex (below text layer)
 *   Touch layer:  renders at zIndex+200 (above text layer), transparent,
 *                 handles drag/resize/rotate gestures + shows selection UI
 *
 * This allows text to be visually ON TOP of objects while objects remain
 * fully interactive. Both layers share the same Animated values so they
 * move in perfect sync.
 *
 * Read-only mode: single layer, no interaction.
 */

import React, { useRef, useMemo } from 'react';
import {
  Animated, PanResponder, Image, View, TouchableOpacity,
  StyleSheet, ImageSourcePropType, Text,
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
  photoId?: number;
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
  onRotate: (id: string, deg: number) => void;
  onDelete: (id: string) => void;
  onBringForward?: (id: string) => void;
  onSendBackward?: (id: string) => void;
}

const HANDLE_SIZE = 12;
const HANDLE_HIT = 28;
const MIN_SIZE = 30;
const MAX_SIZE = 400;
const ROTATION_HANDLE_DISTANCE = 24;
const ROTATION_STEP = 15;
const TOUCH_LAYER_Z_BOOST = 200; // above textLayer (zIndex 100)

export function CanvasObject({
  data,
  editable,
  selected,
  onSelect,
  onMove,
  onResize,
  onRotate,
  onDelete,
  onBringForward,
  onSendBackward,
}: CanvasObjectProps) {
  const { id, type, x, y, width, height, rotation, zIndex } = data;
  const aspectRatio = useRef(width / (height || 1)).current;

  const pan = useRef(new Animated.ValueXY({ x, y })).current;
  const liftScale = useRef(new Animated.Value(1)).current;
  const resizeScale = useRef(new Animated.Value(1)).current;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resizeStart = useRef({ w: width, h: height });
  const rotateStart = useRef({ rotation });

  // Sync position when data changes
  const lastDataPos = useRef({ x, y });
  if (lastDataPos.current.x !== x || lastDataPos.current.y !== y) {
    pan.setValue({ x, y });
    lastDataPos.current = { x, y };
  }

  // ── Drag (롱프레스 선택 모델) ──
  const LONG_PRESS_MS = 400; // 선택까지 걸리는 시간
  const panResponder = useMemo(() => {
    if (!editable) return null;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        selected && (Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3),
      // ScrollView가 gesture를 가로채지 못하도록 차단
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        if (selected) {
          // 이미 선택된 상태 → 즉시 드래그 시작
          pan.extractOffset();
          Animated.spring(liftScale, { toValue: 1.05, friction: 6, useNativeDriver: true }).start();
        } else {
          // 미선택 → 롱프레스 타이머로 선택 진입
          longPressTimer.current = setTimeout(() => {
            onSelect(id);
            Animated.spring(liftScale, { toValue: 1.08, friction: 6, useNativeDriver: true }).start();
            // 선택 직후 드래그 준비
            pan.extractOffset();
          }, LONG_PRESS_MS);
        }
      },
      onPanResponderMove: (_e, gs) => {
        // 롱프레스 대기 중 이동 → 타이머 취소
        if (longPressTimer.current && (Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5)) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        // 선택된 상태에서만 드래그
        if (selected) {
          Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(_e, gs);
        }
      },
      onPanResponderRelease: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        if (selected) {
          Animated.spring(liftScale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
          pan.flattenOffset();
          onMove(id, (pan.x as any)._value ?? x, (pan.y as any)._value ?? y);
        }
      },
    });
  }, [editable, id, selected, onMove, onSelect]);

  // ── Resize (bottom-right) — scale 기반으로 부드럽게 ──
  const resizePanResponder = useMemo(() => {
    if (!editable) return null;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        resizeStart.current = { w: width, h: height };
      },
      onPanResponderMove: (_e, gs) => {
        const delta = (gs.dx + gs.dy) / 2;
        const newW = Math.max(MIN_SIZE, Math.min(MAX_SIZE, resizeStart.current.w + delta));
        const scaleFactor = newW / (resizeStart.current.w || 1);
        resizeScale.setValue(scaleFactor);
      },
      onPanResponderRelease: () => {
        const scaleFactor = (resizeScale as any)._value ?? 1;
        const finalW = Math.round(Math.max(MIN_SIZE, Math.min(MAX_SIZE, resizeStart.current.w * scaleFactor)));
        const finalH = type === 'sticker' ? finalW : Math.round(Math.max(MIN_SIZE, Math.min(MAX_SIZE, finalW / aspectRatio)));
        resizeScale.setValue(1);
        onResize(id, finalW, finalH);
      },
    });
  }, [editable, id, width, height, type, aspectRatio]);

  // ── Rotation (top-center) ──
  const rotatePanResponder = useMemo(() => {
    if (!editable) return null;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => { rotateStart.current = { rotation }; },
      onPanResponderMove: (_e, gs) => {
        const deltaDeg = gs.dx * 0.5;
        const raw = rotateStart.current.rotation + deltaDeg;
        const snapped = Math.round(raw / 15) * 15;
        onRotate(id, Math.round(Math.abs(raw - snapped) < 3 ? snapped : raw));
      },
      onPanResponderRelease: () => {},
    });
  }, [editable, id, rotation]);

  const imageSource = type === 'photo' ? { uri: data.photoUri } : data.stickerSource;
  if (!imageSource) return null;

  const rotationTransform = rotation ? [{ rotate: `${rotation}deg` }] : [];

  // ══════════════════════════════════════
  // READ-ONLY MODE — single layer
  // ══════════════════════════════════════
  if (!editable) {
    return (
      <Animated.View
        style={[styles.container, {
          width, height, zIndex,
          transform: [{ translateX: x }, { translateY: y }, ...rotationTransform],
        }]}
      >
        <Image
          source={imageSource}
          style={{ width, height, borderRadius: type === 'photo' ? 8 : 0 }}
          resizeMode={type === 'photo' ? 'cover' : 'contain'}
        />
      </Animated.View>
    );
  }

  // ══════════════════════════════════════
  // EDITABLE MODE — dual layer
  // ══════════════════════════════════════
  const sharedTransform = [
    { translateX: pan.x },
    { translateY: pan.y },
    ...rotationTransform,
  ];

  return (
    <>
      {/* ── Visual layer: renders image at real zIndex (below text) ── */}
      <Animated.View
        pointerEvents="none"
        style={[styles.container, {
          width, height, zIndex,
          transform: [...sharedTransform, { scale: Animated.multiply(liftScale, resizeScale) }],
        }]}
      >
        <Image
          source={imageSource}
          style={{ width, height, borderRadius: type === 'photo' ? 8 : 0 }}
          resizeMode={type === 'photo' ? 'cover' : 'contain'}
        />
      </Animated.View>

      {/* ── Touch layer: above text, transparent, handles gestures ── */}
      <Animated.View
        style={[styles.container, {
          width, height,
          zIndex: zIndex + TOUCH_LAYER_Z_BOOST,
          transform: [...sharedTransform, { scale: Animated.multiply(liftScale, resizeScale) }],
        }]}
        {...panResponder?.panHandlers}
      >
        {/* Invisible hit area */}
        <View style={{ width, height, backgroundColor: 'transparent' }} />

        {/* Selection UI */}
        {selected && (
          <>
            {/* Dashed border */}
            <View
              style={[styles.selectionBorder, { width: width + 4, height: height + 4 }]}
              pointerEvents="box-none"
            >
              <View style={[styles.handle, styles.handleTL]} />
              <View style={[styles.handle, styles.handleTR]} />
              <View style={[styles.handle, styles.handleBL]} />
              <View style={[styles.handleHit, styles.handleBR]} {...resizePanResponder?.panHandlers}>
                <View style={[styles.handle, { borderColor: '#4CAF50' }]} />
              </View>
            </View>

            {/* Rotation handle (top-center) */}
            <View style={[styles.rotationLine, {
              left: width / 2 - 0.5,
              top: -(ROTATION_HANDLE_DISTANCE + HANDLE_SIZE / 2),
              height: ROTATION_HANDLE_DISTANCE,
            }]} />
            <View
              style={[styles.handleHit, {
                position: 'absolute',
                top: -(ROTATION_HANDLE_DISTANCE + HANDLE_HIT / 2 + HANDLE_SIZE / 2),
                left: width / 2 - HANDLE_HIT / 2,
              }]}
              {...rotatePanResponder?.panHandlers}
            >
              <View style={[styles.handle, styles.rotationHandle]} />
            </View>

            {/* Action bar */}
            <View style={styles.actionBar}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(id)}>
                <Text style={styles.deleteText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => onRotate(id, rotation - ROTATION_STEP)}>
                <Text style={styles.actionSmall}>{'↺'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => onRotate(id, rotation + ROTATION_STEP)}>
                <Text style={styles.actionSmall}>{'↻'}</Text>
              </TouchableOpacity>
              {onSendBackward && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => onSendBackward(id)}>
                  <View style={styles.actionIcon}>
                    <View style={styles.layerBack1} />
                    <View style={styles.layerBack2} />
                  </View>
                </TouchableOpacity>
              )}
              {onBringForward && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => onBringForward(id)}>
                  <View style={styles.actionIcon}>
                    <View style={styles.layerFront1} />
                    <View style={styles.layerFront2} />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0 },
  selectionBorder: {
    position: 'absolute', top: -2, left: -2,
    borderWidth: 1.5, borderColor: '#4A90D9', borderRadius: 4, borderStyle: 'dashed',
  },
  handle: {
    width: HANDLE_SIZE, height: HANDLE_SIZE, borderRadius: HANDLE_SIZE / 2,
    backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#4A90D9',
  },
  handleHit: { width: HANDLE_HIT, height: HANDLE_HIT, alignItems: 'center', justifyContent: 'center' },
  handleTL: { position: 'absolute', top: -(HANDLE_SIZE / 2), left: -(HANDLE_SIZE / 2) },
  handleTR: { position: 'absolute', top: -(HANDLE_SIZE / 2), right: -(HANDLE_SIZE / 2) },
  handleBL: { position: 'absolute', bottom: -(HANDLE_SIZE / 2), left: -(HANDLE_SIZE / 2) },
  handleBR: { position: 'absolute', bottom: -(HANDLE_HIT / 2), right: -(HANDLE_HIT / 2) },
  rotationLine: { position: 'absolute', width: 1, backgroundColor: '#4A90D9' },
  rotationHandle: { borderColor: '#FF9800', backgroundColor: '#FFF8E1' },
  actionBar: {
    position: 'absolute', bottom: -36, left: -10, right: -10,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  actionBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  deleteText: { fontSize: 16, fontWeight: '700', color: '#FF4444', lineHeight: 18 },
  actionSmall: { fontSize: 14, color: '#666', lineHeight: 16 },
  actionIcon: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  layerBack1: { position: 'absolute', top: 2, left: 2, width: 7, height: 7, borderWidth: 1.5, borderColor: '#999', borderRadius: 1, backgroundColor: '#FFF' },
  layerBack2: { width: 7, height: 7, borderWidth: 1.5, borderColor: '#999', borderRadius: 1 },
  layerFront1: { width: 7, height: 7, borderWidth: 1.5, borderColor: '#4A90D9', borderRadius: 1 },
  layerFront2: { position: 'absolute', top: 2, left: 2, width: 7, height: 7, borderWidth: 1.5, borderColor: '#4A90D9', borderRadius: 1, backgroundColor: '#FFF' },
});
