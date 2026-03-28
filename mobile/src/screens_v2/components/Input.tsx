/**
 * Input v3 — Warm paper-tone text input
 *
 * Features: focus animation, error state, helper text, icon support
 * Ivory surface, sand border, sage focus accent.
 *
 * v3 design system tokens. No react-native-svg.
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View, TextInput, Text, StyleSheet, Animated, TextInputProps, ViewStyle,
} from 'react-native';
import {
  colors, fontFamily, spacing, borderRadius, duration,
} from '../../design-system-v3';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label, error, helper, leftIcon, rightIcon, containerStyle,
  ...textInputProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1, duration: duration.fast, useNativeDriver: false,
    }).start();
    textInputProps.onFocus?.(e);
  }, [borderAnim, textInputProps.onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0, duration: duration.fast, useNativeDriver: false,
    }).start();
    textInputProps.onBlur?.(e);
  }, [borderAnim, textInputProps.onBlur]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? '#E05454' : colors.accentSand + '50',
      error ? '#E05454' : colors.accentPrimary,
    ],
  });

  const borderWidth = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[
          styles.label,
          {
            color: error ? '#E05454' : (isFocused ? colors.accentPrimary : colors.textSecondary),
          },
        ]}>
          {label}
        </Text>
      )}

      <Animated.View style={[
        styles.container,
        {
          height: textInputProps.multiline ? undefined : 52,
          minHeight: textInputProps.multiline ? 120 : undefined,
          borderColor,
          borderWidth,
        },
      ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          {...textInputProps}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.input,
            {
              textAlignVertical: textInputProps.multiline ? 'top' : 'center',
              paddingTop: textInputProps.multiline ? spacing.md : 0,
            },
          ]}
        />

        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </Animated.View>

      {(error || helper) && (
        <Text style={[
          styles.helper,
          { color: error ? '#E05454' : colors.textTertiary },
        ]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  label: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 13, fontWeight: '500',
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },
  container: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.sans,
    fontSize: 15, color: colors.textPrimary,
  },
  leftIcon: { marginRight: spacing.md },
  rightIcon: { marginLeft: spacing.md },
  helper: {
    fontFamily: fontFamily.sans,
    fontSize: 11, marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
});
