/**
 * Button v3 — Warm scrapbook-tone action button
 *
 * Variants: primary (sage), secondary (outline), ghost, danger
 * Sizes: sm, md, lg
 * Features: press animation, loading state, icon support
 *
 * v3 design system tokens. No react-native-svg.
 */

import React, { useRef, useCallback } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, Animated,
  ActivityIndicator, ViewStyle, TextStyle, View,
} from 'react-native';
import {
  colors, fontFamily, shadows, spacing, borderRadius, feedback,
} from '../../design-system-v3';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label, onPress, variant = 'primary', size = 'md',
  disabled = false, loading = false, icon, iconPosition = 'left',
  fullWidth = false, style,
}: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: feedback.pressScale, tension: 300, friction: 10, useNativeDriver: true,
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1, tension: 200, friction: 12, useNativeDriver: true,
    }).start();
  }, []);

  const containerStyle = getContainerStyle(variant, size, disabled, fullWidth);
  const textStyle = getTextStyle(variant, size, disabled);
  const loaderColor = variant === 'primary' || variant === 'danger'
    ? colors.surfacePure : colors.accentPrimary;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        style={containerStyle}
      >
        {loading ? (
          <ActivityIndicator color={loaderColor} size="small" />
        ) : (
          <View style={styles.content}>
            {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
            <Text style={textStyle}>{label}</Text>
            {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function getContainerStyle(
  variant: ButtonVariant, size: ButtonSize, disabled: boolean, fullWidth: boolean,
): ViewStyle {
  const base: ViewStyle = {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: borderRadius.lg,
    ...(fullWidth ? { width: '100%' } : {}),
  };

  const sizes: Record<ButtonSize, ViewStyle> = {
    sm: { height: 40, paddingHorizontal: spacing.lg },
    md: { height: 52, paddingHorizontal: spacing.xl },
    lg: { height: 56, paddingHorizontal: spacing['2xl'] },
  };

  const variants: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: disabled ? colors.accentPrimaryLight : colors.accentPrimary,
      ...(disabled ? {} : shadows.crisp),
    },
    secondary: {
      backgroundColor: colors.bgIvory,
      borderWidth: 1,
      borderColor: disabled ? colors.accentSand + '40' : colors.accentPrimary,
    },
    ghost: { backgroundColor: 'transparent' },
    danger: {
      backgroundColor: disabled ? '#F0E0E0' : '#E05454',
    },
  };

  return { ...base, ...sizes[size], ...variants[variant] };
}

function getTextStyle(variant: ButtonVariant, size: ButtonSize, disabled: boolean): TextStyle {
  const base: TextStyle = size === 'sm'
    ? { fontFamily: fontFamily.sansMedium, fontSize: 13, fontWeight: '500' }
    : { fontFamily: fontFamily.sansMedium, fontSize: 15, fontWeight: '600' };

  const textColors: Record<ButtonVariant, string> = {
    primary: disabled ? 'rgba(255,255,255,0.6)' : colors.surfacePure,
    secondary: disabled ? colors.textTertiary : colors.accentPrimary,
    ghost: disabled ? colors.textTertiary : colors.accentPrimary,
    danger: disabled ? 'rgba(255,255,255,0.6)' : colors.surfacePure,
  };

  return { ...base, color: textColors[variant] };
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', alignItems: 'center' },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});
