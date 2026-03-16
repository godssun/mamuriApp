/**
 * Design System v2 — Custom Tab Bar
 *
 * Premium tab bar inspired by Instagram / Apple Music.
 * Layout: [diary tab] [write button] [companion tab]
 *
 * - Left/Right: clean icon + label, aligned inside bar
 * - Center: elevated circular write button, integrated in bar
 * - Subtle glassmorphism feel with top border
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeV2 } from '../../design-system-v2';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme, isDark } = useThemeV2();
  const insets = useSafeAreaInsets();
  const writeScale = useRef(new Animated.Value(1)).current;

  const TAB_BAR_HEIGHT = 56;
  const WRITE_BUTTON_SIZE = 52;

  const handleWritePress = () => {
    // Press animation
    Animated.sequence([
      Animated.spring(writeScale, {
        toValue: 0.9,
        ...theme.springs.snappy,
        useNativeDriver: true,
      }),
      Animated.spring(writeScale, {
        toValue: 1,
        ...theme.springs.gentle,
        useNativeDriver: true,
      }),
    ]).start();
    navigation.navigate('DiaryList', { screen: 'WriteDiary' });
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDark
          ? 'rgba(20, 20, 28, 0.95)'
          : 'rgba(255, 255, 255, 0.97)',
        borderTopColor: theme.colors.tabBarBorder,
        paddingBottom: insets.bottom,
        height: TAB_BAR_HEIGHT + insets.bottom,
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: isDark ? 0.2 : 0.06,
            shadowRadius: 8,
          },
          android: { elevation: 8 },
        }),
      },
    ]}>
      {/* Left tab — Diary */}
      {renderTab(0)}

      {/* Center write button */}
      <View style={styles.centerContainer}>
        <Animated.View style={{ transform: [{ scale: writeScale }] }}>
          <TouchableOpacity
            style={[styles.writeButton, {
              width: WRITE_BUTTON_SIZE,
              height: WRITE_BUTTON_SIZE,
              borderRadius: WRITE_BUTTON_SIZE / 2,
              backgroundColor: theme.colors.primary,
              ...theme.primaryShadow,
            }]}
            onPress={handleWritePress}
            activeOpacity={0.85}
          >
            <Text style={styles.writeIcon}>+</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Right tab — Companion */}
      {renderTab(1)}
    </View>
  );

  function renderTab(index: number) {
    const route = state.routes[index];
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
    const label = options.title ?? route.name;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    // Render icon based on route name
    const icon = route.name === 'DiaryList'
      ? renderBookIcon(isFocused)
      : renderChatIcon(isFocused);

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={label}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.tab}
        activeOpacity={0.7}
      >
        {icon}
        <Text style={[
          styles.tabLabel,
          {
            color: isFocused ? theme.colors.tabActive : theme.colors.tabInactive,
            fontWeight: isFocused ? '600' : '400',
          },
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderBookIcon(active: boolean) {
    const color = active ? theme.colors.tabActive : theme.colors.tabInactive;
    return (
      <View style={styles.iconContainer}>
        <View style={[
          styles.bookIcon,
          {
            borderColor: color,
            borderWidth: active ? 2 : 1.5,
            borderRadius: 3,
          },
        ]}>
          <View style={[
            styles.bookSpine,
            { backgroundColor: color, left: 2 },
          ]} />
        </View>
      </View>
    );
  }

  function renderChatIcon(active: boolean) {
    const color = active ? theme.colors.tabActive : theme.colors.tabInactive;
    return (
      <View style={styles.iconContainer}>
        <View style={[
          styles.chatBubble,
          {
            borderColor: color,
            borderWidth: active ? 2 : 1.5,
            borderRadius: 10,
          },
        ]}>
          <View style={[styles.chatDots]}>
            <View style={[styles.chatDot, { backgroundColor: color }]} />
            <View style={[styles.chatDot, { backgroundColor: color }]} />
          </View>
        </View>
        {/* Bubble tail */}
        <View style={[styles.chatTail, {
          borderLeftColor: color,
          borderLeftWidth: active ? 2 : 1.5,
          borderBottomColor: color,
          borderBottomWidth: active ? 2 : 1.5,
        }]} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 2,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  writeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  writeIcon: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    marginTop: -1,
  },
  // Book icon
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookIcon: {
    width: 18,
    height: 16,
    position: 'relative',
  },
  bookSpine: {
    position: 'absolute',
    width: 1.5,
    top: 2,
    bottom: 2,
  },
  // Chat icon
  chatBubble: {
    width: 20,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatDots: {
    flexDirection: 'row',
    gap: 3,
  },
  chatDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
  },
  chatTail: {
    position: 'absolute',
    bottom: 1,
    right: 4,
    width: 5,
    height: 5,
    transform: [{ rotate: '-45deg' }],
    backgroundColor: 'transparent',
  },
});
