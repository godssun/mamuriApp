/**
 * CanvasHintToast — 캔버스 오브젝트 조작 힌트 토스트
 *
 * 사진/스티커 최초 추가 시 1회만 표시.
 * "꾹 눌러 자유롭게 꾸며보세요" 같은 따뜻한 안내 메시지.
 * 3.5초 후 자동 fade-out, 탭으로 즉시 dismiss.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { colors, fontFamily, shadows, borderRadius, spacing } from '../../design-system-v3';

interface Props {
  visible: boolean;
  message: string;
  onDismiss: () => void;
}

export function CanvasHintToast({ visible, message, onDismiss }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      timerRef.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => onDismiss());
      }, 3500);
    } else {
      opacity.setValue(0);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  if (!visible) return null;

  const handleTap = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="box-none">
      <TouchableOpacity onPress={handleTap} activeOpacity={0.9}>
        <Text style={styles.text}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: spacing['2xl'],
    right: spacing['2xl'],
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    zIndex: 500,
    ...shadows.soft,
  },
  text: {
    fontFamily: fontFamily.script,
    fontSize: 16,
    color: colors.textSecondary,
  },
});
