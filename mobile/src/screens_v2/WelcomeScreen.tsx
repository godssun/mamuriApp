/**
 * WelcomeScreen — Onboarding / first impression
 *
 * Full-screen gradient feel with app identity.
 * Splash icon (crescent moon + leaf character) centered.
 * Warm fade-in entrance animation.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemeV2 } from '../design-system-v2';
import type { AuthStackParamList } from '../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const { theme } = useThemeV2();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 800, useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0, duration: 800, useNativeDriver: true,
        }),
      ]),
      Animated.spring(btnAnim, {
        toValue: 1, tension: 50, friction: 8, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Gradient-like background layers */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      {/* Content */}
      <View style={styles.content}>
        <Animated.View style={[
          styles.center,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
          <Image
            source={require('../../assets/splash-icon.png')}
            style={styles.splashIcon}
          />

          <Text style={[styles.appName, { color: theme.colors.primary }]}>
            마무리
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.textTertiary }]}>
            감정을 기록하고, 마무리가 기억해요
          </Text>
        </Animated.View>

        {/* Bottom CTA */}
        <Animated.View style={[
          styles.bottomSection,
          {
            opacity: btnAnim,
            transform: [{
              translateY: btnAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          },
        ]}>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.replace('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>시작하기</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  bgTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FAFAF8',
  },
  bgBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#F5F3EE',
    opacity: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  splashIcon: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  startButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#6356D9',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 14,
      },
      android: { elevation: 6 },
    }),
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});
