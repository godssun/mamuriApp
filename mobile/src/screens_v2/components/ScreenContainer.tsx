/**
 * ScreenContainer v3 — Warm paper screen wrapper
 *
 * Provides consistent screen layout with safe area, status bar,
 * and scroll behavior. Cream paper background by default.
 *
 * v3 design system tokens.
 */

import React from 'react';
import {
  View, ScrollView, KeyboardAvoidingView, Platform,
  StatusBar, StyleSheet, ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, layout } from '../../design-system-v3';

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
  children, scrollable = true, keyboardAvoiding = false,
  padded = true, style, contentStyle, header, footer,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.bgCream,
  };

  const contentPadding: ViewStyle = padded
    ? { paddingHorizontal: layout.screenPaddingH }
    : {};

  const inner = (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgCream} />
      {header}
      {scrollable ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            contentPadding,
            { paddingBottom: insets.bottom + spacing['3xl'] },
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
