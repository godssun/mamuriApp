/**
 * Design System v2 — Input Component
 *
 * Features: focus animation, error state, helper text, icon support
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useThemeV2 } from '../../design-system-v2';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  containerStyle,
  ...textInputProps
}: InputProps) {
  const { theme } = useThemeV2();
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: theme.duration.fast,
      useNativeDriver: false,
    }).start();
    textInputProps.onFocus?.(e);
  }, [borderAnim, theme, textInputProps.onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: theme.duration.fast,
      useNativeDriver: false,
    }).start();
    textInputProps.onBlur?.(e);
  }, [borderAnim, theme, textInputProps.onBlur]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? theme.colors.error : theme.colors.border,
      error ? theme.colors.error : theme.colors.borderFocus,
    ],
  });

  const borderWidth = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[
          theme.typography.labelMedium,
          {
            color: error ? theme.colors.error : (isFocused ? theme.colors.primary : theme.colors.textSecondary),
            marginBottom: theme.spacing.xs,
          },
        ]}>
          {label}
        </Text>
      )}

      <Animated.View style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          height: textInputProps.multiline ? undefined : theme.layout.inputHeight,
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
          placeholderTextColor={theme.colors.textDisabled}
          style={[
            theme.typography.bodyMedium,
            styles.input,
            {
              color: theme.colors.textPrimary,
              paddingTop: textInputProps.multiline ? theme.spacing.md : 0,
            },
          ]}
        />

        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </Animated.View>

      {(error || helper) && (
        <Text style={[
          theme.typography.caption,
          {
            color: error ? theme.colors.error : theme.colors.textTertiary,
            marginTop: theme.spacing.xs,
            paddingHorizontal: theme.spacing.xs,
          },
        ]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    textAlignVertical: 'top',
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 12,
  },
});
