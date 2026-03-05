/**
 * Preview Home — Screen picker for v2 design preview
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeV2 } from '../design-system-v2';

const SCREENS = [
  { name: 'LoginV2' as const, label: 'Login', emoji: '🔑' },
  { name: 'SignupV2' as const, label: 'Signup', emoji: '✨' },
  { name: 'DiaryListV2' as const, label: 'Diary List', emoji: '📚' },
  { name: 'DiaryWriteV2' as const, label: 'Write Diary', emoji: '✏️' },
  { name: 'DiaryDetailV2' as const, label: 'Diary Detail', emoji: '📖' },
  { name: 'AICommentV2' as const, label: 'AI Chat', emoji: '🌿' },
];

export function PreviewHomeScreen({ navigation }: any) {
  const { theme, isDark, toggleTheme } = useThemeV2();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + theme.spacing['2xl'],
            paddingBottom: insets.bottom + theme.spacing['3xl'],
            paddingHorizontal: theme.layout.screenPaddingH,
          },
        ]}
      >
        {/* Header */}
        <Text style={[
          theme.typography.displayMedium,
          { color: theme.colors.textPrimary },
        ]}>
          Design v2
        </Text>
        <Text style={[
          theme.typography.bodyMedium,
          { color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
        ]}>
          AI Companion Style Preview
        </Text>

        {/* Theme toggle */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.themeToggle, {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            ...theme.shadows.sm,
            marginTop: theme.spacing.xl,
          }]}
          activeOpacity={0.7}
        >
          <Text style={[theme.typography.labelLarge, { color: theme.colors.primary }]}>
            {isDark ? '☀️  Light Mode' : '🌙  Dark Mode'}
          </Text>
        </TouchableOpacity>

        {/* Screen list */}
        <View style={{ marginTop: theme.spacing['3xl'] }}>
          <Text style={[
            theme.typography.titleSmall,
            { color: theme.colors.textTertiary, marginBottom: theme.spacing.md },
          ]}>
            SCREENS
          </Text>

          {SCREENS.map((screen) => (
            <TouchableOpacity
              key={screen.name}
              onPress={() => navigation.navigate(screen.name)}
              style={[styles.screenCard, {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
                ...theme.shadows.sm,
                marginBottom: theme.spacing.md,
                padding: theme.layout.cardPadding,
              }]}
              activeOpacity={0.7}
            >
              <Text style={styles.screenEmoji}>{screen.emoji}</Text>
              <View style={styles.screenInfo}>
                <Text style={[
                  theme.typography.titleMedium,
                  { color: theme.colors.textPrimary },
                ]}>
                  {screen.label}
                </Text>
                <Text style={[
                  theme.typography.caption,
                  { color: theme.colors.textTertiary },
                ]}>
                  {screen.name}
                </Text>
              </View>
              <Text style={[
                theme.typography.bodyLarge,
                { color: theme.colors.textDisabled },
              ]}>
                →
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Design info */}
        <View style={[styles.infoCard, {
          backgroundColor: theme.colors.primarySubtle,
          borderRadius: theme.borderRadius.lg,
          marginTop: theme.spacing.xl,
          padding: theme.layout.cardPadding,
        }]}>
          <Text style={[
            theme.typography.labelMedium,
            { color: theme.colors.primary, marginBottom: theme.spacing.sm },
          ]}>
            Design System v2
          </Text>
          <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, lineHeight: 20 }]}>
            Primary: Indigo #6356D9{'\n'}
            Body: 17pt / System{'\n'}
            Grid: 8pt spacing{'\n'}
            Radius: 4-24px scale
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {},
  themeToggle: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  screenCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  screenEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  screenInfo: {
    flex: 1,
    gap: 2,
  },
  infoCard: {},
});
