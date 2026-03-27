/**
 * Tab Bar v5 — Warm emotional journal navigation
 *
 * Layout: [Home] [Diary] [+] [Companion] [Reflect]
 * Pure View-based icons — warm, rounded, premium feel
 * Soft shadow instead of border, semi-transparent background
 */

import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT = '#6356D9';
const MUTED = '#C4C1B9';
const W = 1.8; // stroke width for icons

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(1)).current;

  const onWrite = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, tension: 300, friction: 10, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 200, friction: 12, useNativeDriver: true }),
    ]).start();
    navigation.navigate('DiaryList', { screen: 'WriteDiary' });
  };

  return (
    <View style={[st.bar, {
      paddingBottom: insets.bottom,
      height: 60 + insets.bottom,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        android: { elevation: 8 },
      }),
    }]}>
      {state.routes.slice(0, 2).map((r, i) => renderTab(r, i))}

      <View style={st.center}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <TouchableOpacity style={st.writeBtn} onPress={onWrite} activeOpacity={0.75}>
            <View style={st.plusH} />
            <View style={st.plusV} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {state.routes.slice(2).map((r, i) => renderTab(r, i + 2))}
    </View>
  );

  function renderTab(route: typeof state.routes[0], idx: number) {
    const focused = state.index === idx;
    const label = descriptors[route.key].options.title ?? route.name;
    const color = focused ? ACCENT : MUTED;

    return (
      <TouchableOpacity
        key={route.key} style={st.tab} activeOpacity={0.5}
        onPress={() => { if (!focused) navigation.navigate(route.name); }}
      >
        <View style={st.iconWrap}>
          {route.name === 'Home' && <HomeIcon color={color} filled={focused} />}
          {route.name === 'DiaryList' && <DiaryIcon color={color} filled={focused} />}
          {route.name === 'Companion' && <CompanionIcon color={color} filled={focused} />}
          {route.name === 'Reflect' && <ReflectIcon color={color} filled={focused} />}
        </View>
        <Text style={[st.label, { color, fontWeight: focused ? '600' : '400' }]}>{label}</Text>
      </TouchableOpacity>
    );
  }
}

/* ── Icons: Warm, rounded, View-based ── */

/** Home: Crescent moon + leaf silhouette (app identity) */
function HomeIcon({ color, filled }: { color: string; filled: boolean }) {
  return (
    <View style={ic.box}>
      {/* Crescent moon: large circle with cutout illusion via smaller offset circle */}
      <View style={{ width: 18, height: 18, position: 'relative' }}>
        {/* Moon body */}
        <View style={{
          width: 16, height: 16, borderRadius: 8,
          backgroundColor: filled ? color : 'transparent',
          borderWidth: filled ? 0 : W,
          borderColor: color,
          position: 'absolute', top: 1, left: 0,
        }} />
        {/* Cutout circle to create crescent shape */}
        <View style={{
          width: 12, height: 12, borderRadius: 6,
          backgroundColor: filled ? '#FAFAF8' : '#FAFAF8',
          position: 'absolute', top: 0, right: 0,
        }} />
        {/* Small leaf dot */}
        <View style={{
          width: 4, height: 4, borderRadius: 2,
          backgroundColor: filled ? color : color,
          position: 'absolute', bottom: 0, right: 2,
        }} />
      </View>
    </View>
  );
}

/** Diary: Open book with rounded corners */
function DiaryIcon({ color, filled }: { color: string; filled: boolean }) {
  return (
    <View style={ic.box}>
      <View style={{ width: 18, height: 16, flexDirection: 'row', gap: 1.5 }}>
        {/* Left page */}
        <View style={{
          flex: 1, height: 16,
          borderTopLeftRadius: 3, borderBottomLeftRadius: 3,
          borderTopRightRadius: 1, borderBottomRightRadius: 1,
          backgroundColor: filled ? color : 'transparent',
          borderWidth: filled ? 0 : W,
          borderColor: color,
        }} />
        {/* Right page */}
        <View style={{
          flex: 1, height: 16,
          borderTopRightRadius: 3, borderBottomRightRadius: 3,
          borderTopLeftRadius: 1, borderBottomLeftRadius: 1,
          backgroundColor: filled ? color : 'transparent',
          borderWidth: filled ? 0 : W,
          borderColor: color,
        }} />
      </View>
    </View>
  );
}

/** Companion: Crescent character silhouette */
function CompanionIcon({ color, filled }: { color: string; filled: boolean }) {
  return (
    <View style={ic.box}>
      {/* Character face: rounded square with eyes */}
      <View style={{
        width: 18, height: 16, borderRadius: 8,
        backgroundColor: filled ? color : 'transparent',
        borderWidth: filled ? 0 : W,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 4,
      }}>
        {/* Left eye */}
        <View style={{
          width: 3, height: 3, borderRadius: 1.5,
          backgroundColor: filled ? '#FAFAF8' : color,
        }} />
        {/* Right eye */}
        <View style={{
          width: 3, height: 3, borderRadius: 1.5,
          backgroundColor: filled ? '#FAFAF8' : color,
        }} />
      </View>
    </View>
  );
}

/** Reflect: Sparkle / star shape */
function ReflectIcon({ color, filled }: { color: string; filled: boolean }) {
  return (
    <View style={ic.box}>
      {/* Large star sparkle */}
      <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
        {/* Vertical line */}
        <View style={{
          position: 'absolute',
          width: 2, height: 16, borderRadius: 1,
          backgroundColor: color,
        }} />
        {/* Horizontal line */}
        <View style={{
          position: 'absolute',
          width: 16, height: 2, borderRadius: 1,
          backgroundColor: color,
        }} />
        {/* Diagonal 1 */}
        <View style={{
          position: 'absolute',
          width: 11, height: 2, borderRadius: 1,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        }} />
        {/* Diagonal 2 */}
        <View style={{
          position: 'absolute',
          width: 11, height: 2, borderRadius: 1,
          backgroundColor: color,
          transform: [{ rotate: '-45deg' }],
        }} />
        {/* Center dot for filled state */}
        {filled && (
          <View style={{
            width: 4, height: 4, borderRadius: 2,
            backgroundColor: color,
          }} />
        )}
      </View>
    </View>
  );
}

const ic = StyleSheet.create({
  box: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
});

const st = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 0,
  },
  tab: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 8, gap: 4,
  },
  iconWrap: { height: 24, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 10, letterSpacing: 0.1 },
  center: { paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  writeBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  plusH: { position: 'absolute', width: 16, height: 1.5, backgroundColor: '#FFF', borderRadius: 1 },
  plusV: { position: 'absolute', width: 1.5, height: 16, backgroundColor: '#FFF', borderRadius: 1 },
});
