/**
 * Design System v2 — Screen Container
 *
 * Provides consistent screen layout with safe area, status bar, and scroll behavior.
 */

import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeV2 } from '../../design-system-v2';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function ScreenContainer({
  children,
  scrollable = true,
  keyboardAvoiding = false,
  padded = true,
  style,
  contentStyle,
  header,
  footer,
}: ScreenContainerProps) {
  const { theme, isDark } = useThemeV2();
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
  };

  const contentPadding: ViewStyle = padded
    ? { paddingHorizontal: theme.layout.screenPaddingH }
    : {};

  const inner = (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      {header}

      {scrollable ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            contentPadding,
            { paddingBottom: insets.bottom + theme.spacing['3xl'] },
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentPadding, contentStyle]}>
          {children}
        </View>
      )}

      {footer}
    </>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={[containerStyle, { paddingTop: insets.top }, style]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {inner}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[containerStyle, { paddingTop: insets.top }, style]}>
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
