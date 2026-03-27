/**
 * Tab Bar v4 — Premium minimal navigation
 *
 * Layout: [Home] [Diary] [+] [Companion] [Reflect]
 * Pure View-based icons with clear differentiation
 * Single accent, clean white bar, subtle top line
 */

import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT = '#6356D9';
const MUTED = '#C4C1B9';

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
      height: 58 + insets.bottom,
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -1 }, shadowOpacity: 0.03, shadowRadius: 4 },
        android: { elevation: 4 },
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

/* ── Icons: Pure View, no emoji, clear shapes ── */

function HomeIcon({ color, filled }: { color: string; filled: boolean }) {
  return (
    <View style={ic.box}>
      {/* Simple circle = home */}
      <View style={[ic.circle, { borderColor: color, backgroundColor: filled ? color : 'transparent' }]} />
    </View>
  );
}

function DiaryIcon({ color, filled }: { color: string; filled: boolean }) {
  return (
    <View style={ic.box}>
      {/* Rectangle = book/diary */}
      <View style={[{ width: 14, height: 16, borderRadius: 2, borderWidth: filled ? 0 : 1.5, borderColor: color, backgroundColor: filled ? color : 'transparent' }]} />
    </View>
  );
}

function CompanionIcon({ color, filled }: { color: string; filled: boolean }) {
  return (
    <View style={ic.box}>
      {/* Rounded square = chat/companion */}
      <View style={[{ width: 16, height: 14, borderRadius: 7, borderWidth: filled ? 0 : 1.5, borderColor: color, backgroundColor: filled ? color : 'transparent' }]} />
    </View>
  );
}

function ReflectIcon({ color, filled }: { color: string; filled: boolean }) {
  return (
    <View style={[ic.box, { flexDirection: 'row', alignItems: 'flex-end', gap: 2 }]}>
      {/* Bar chart = reflect */}
      {[8, 14, 11].map((h, i) => (
        <View key={i} style={[{ width: 4, height: h, borderRadius: 2, backgroundColor: filled ? color : 'transparent', borderWidth: filled ? 0 : 1, borderColor: color }]} />
      ))}
    </View>
  );
}

const ic = StyleSheet.create({
  box: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  circle: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
});

const st = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0EEE8',
  },
  tab: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 8, gap: 4,
  },
  iconWrap: { height: 22, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 10, letterSpacing: 0.1 },
  center: { paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  writeBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: ACCENT, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
      android: { elevation: 6 },
    }),
  },
  plusH: { position: 'absolute', width: 16, height: 1.5, backgroundColor: '#FFF', borderRadius: 1 },
  plusV: { position: 'absolute', width: 1.5, height: 16, backgroundColor: '#FFF', borderRadius: 1 },
});
