/**
 * Design System v2 — Button Component
 *
 * Variants: primary, secondary, ghost, danger
 * Sizes: sm, md, lg
 * Features: press animation, loading state, icon support
 */

import React, { useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useThemeV2 } from '../../design-system-v2';

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
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
}: ButtonProps) {
  const { theme } = useThemeV2();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: theme.feedback.pressScale,
      ...theme.springs.snappy,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim, theme]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...theme.springs.gentle,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim, theme]);

  const containerStyle = getContainerStyle(theme, variant, size, disabled, fullWidth);
  const textStyle = getTextStyle(theme, variant, size, disabled);
  const loaderColor = variant === 'primary' || variant === 'danger'
    ? theme.colors.onPrimary
    : theme.colors.primary;

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
            {icon && iconPosition === 'left' && (
              <View style={styles.iconLeft}>{icon}</View>
            )}
            <Text style={textStyle}>{label}</Text>
            {icon && iconPosition === 'right' && (
              <View style={styles.iconRight}>{icon}</View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function getContainerStyle(
  theme: any,
  variant: ButtonVariant,
  size: ButtonSize,
  disabled: boolean,
  fullWidth: boolean,
): ViewStyle {
  const base: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    ...(fullWidth ? { width: '100%' } : {}),
  };

  // Size
  const sizes: Record<ButtonSize, ViewStyle> = {
    sm: {
      height: theme.layout.buttonHeightSm,
      paddingHorizontal: theme.spacing.lg,
    },
    md: {
      height: theme.layout.buttonHeight,
      paddingHorizontal: theme.spacing.xl,
    },
    lg: {
      height: 56,
      paddingHorizontal: theme.spacing['2xl'],
    },
  };

  // Variant
  const variants: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: disabled ? theme.colors.primaryLight : theme.colors.primary,
      ...(!disabled ? theme.primaryShadow : {}),
    },
    secondary: {
      backgroundColor: theme.colors.primarySubtle,
      borderWidth: 1,
      borderColor: disabled ? theme.colors.border : theme.colors.primaryLight,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: disabled ? theme.colors.errorSubtle : theme.colors.error,
    },
  };

  return { ...base, ...sizes[size], ...variants[variant] };
}

function getTextStyle(
  theme: any,
  variant: ButtonVariant,
  size: ButtonSize,
  disabled: boolean,
): TextStyle {
  const base = size === 'sm' ? theme.typography.labelMedium : theme.typography.labelLarge;

  const colors: Record<ButtonVariant, string> = {
    primary: disabled ? 'rgba(255,255,255,0.6)' : theme.colors.onPrimary,
    secondary: disabled ? theme.colors.textDisabled : theme.colors.primary,
    ghost: disabled ? theme.colors.textDisabled : theme.colors.primary,
    danger: disabled ? 'rgba(255,255,255,0.6)' : theme.colors.onPrimary,
  };

  return { ...base, color: colors[variant] };
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
