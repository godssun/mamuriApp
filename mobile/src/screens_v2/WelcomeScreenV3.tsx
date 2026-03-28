/**
 * WelcomeScreenV3 — Scrapbook-style onboarding
 *
 * Paper-textured background with a hand-placed letter card,
 * botanical View-based accents, tape decoration, postal stamp,
 * and handwritten signature. Warm, quiet first impression.
 *
 * No react-native-svg dependency — pure RN Views for all decorations.
 * Uses design-system-v3 tokens and components exclusively.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, Animated, StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../types';

import {
  colors,
  fontFamily,
  shadows,
  borderRadius,
  rotations,
  duration,
} from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import { ScrapbookButton } from '../design-system-v3/components/ScrapbookButton';

const { width: SCREEN_W } = Dimensions.get('window');

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

// ── Botanical Art (pure View) ──
function BotanicalArt() {
  return (
    <View style={botanicalStyles.container}>
      {/* Main stem */}
      <View style={botanicalStyles.stem} />
      {/* Branch */}
      <View style={botanicalStyles.branch} />
      {/* Leaves */}
      <View style={[botanicalStyles.leaf, botanicalStyles.leaf1]} />
      <View style={[botanicalStyles.leaf, botanicalStyles.leaf2]} />
      <View style={[botanicalStyles.leaf, botanicalStyles.leaf3]} />
      {/* Lavender berry clusters */}
      <View style={[botanicalStyles.berry, { top: 12, right: 18 }]} />
      <View style={[botanicalStyles.berry, botanicalStyles.berrySmall, { top: 6, right: 26 }]} />
      <View style={[botanicalStyles.berry, botanicalStyles.berrySmall, { top: 8, right: 12 }]} />
      <View style={[botanicalStyles.berry, { top: 20, right: 20 }]} />
      <View style={[botanicalStyles.berry, botanicalStyles.berrySmall, { top: 16, right: 10 }]} />
      {/* Lower cluster */}
      <View style={[botanicalStyles.berry, { top: 70, right: 0 }]} />
      <View style={[botanicalStyles.berry, botanicalStyles.berrySmall, { top: 64, right: 8 }]} />
      <View style={[botanicalStyles.berry, botanicalStyles.berrySmall, { top: 76, right: 4 }]} />
    </View>
  );
}

const botanicalStyles = StyleSheet.create({
  container: {
    width: 120,
    height: 160,
    position: 'relative',
  },
  stem: {
    position: 'absolute',
    left: 50,
    top: 20,
    width: 1,
    height: 140,
    backgroundColor: colors.accentPrimary,
    opacity: 0.6,
    transform: [{ rotate: '-15deg' }],
  },
  branch: {
    position: 'absolute',
    left: 55,
    top: 80,
    width: 1,
    height: 80,
    backgroundColor: colors.accentPrimary,
    opacity: 0.4,
    transform: [{ rotate: '-40deg' }],
  },
  leaf: {
    position: 'absolute',
    backgroundColor: colors.accentPrimaryLight,
    opacity: 0.35,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.accentPrimary,
  },
  leaf1: {
    left: 38, top: 90,
    width: 18, height: 32,
    transform: [{ rotate: '-20deg' }],
  },
  leaf2: {
    left: 50, top: 55,
    width: 22, height: 36,
    transform: [{ rotate: '25deg' }],
  },
  leaf3: {
    left: 60, top: 25,
    width: 16, height: 28,
    transform: [{ rotate: '15deg' }],
  },
  berry: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accentSecondary,
    opacity: 0.7,
  },
  berrySmall: {
    width: 5,
    height: 5,
    borderRadius: 3,
    opacity: 0.5,
  },
});

// ── Postal Stamp (pure View) ──
function PostalStamp() {
  return (
    <View style={stampStyles.container}>
      <View style={stampStyles.outerCircle} />
      <View style={stampStyles.innerCircle} />
      <View style={stampStyles.star} />
    </View>
  );
}

const stampStyles = StyleSheet.create({
  container: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
    opacity: 0.55,
  },
  outerCircle: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.2,
    borderColor: colors.accentSecondary,
    borderStyle: 'dashed',
  },
  innerCircle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 0.6,
    borderColor: colors.accentSecondary,
  },
  star: {
    width: 16,
    height: 16,
    borderRadius: 2,
    backgroundColor: colors.accentSecondary,
    opacity: 0.6,
    transform: [{ rotate: '45deg' }],
  },
});

// ── Main Screen ──
export function WelcomeScreenV3({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;
  const btnFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(cardFade, {
          toValue: 1, duration: duration.gentle, useNativeDriver: true,
        }),
        Animated.timing(cardSlide, {
          toValue: 0, duration: duration.gentle, useNativeDriver: true,
        }),
      ]),
      Animated.timing(btnFade, {
        toValue: 1, duration: duration.slow, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <PaperBackground variant="lined" color="cream">
      <View style={[styles.container, { paddingTop: insets.top + 80 }]}>
        {/* ── Welcome Card ── */}
        <Animated.View style={[
          styles.card,
          {
            opacity: cardFade,
            transform: [
              { translateY: cardSlide },
              { rotate: rotations.cardTiltCCW },
            ],
          },
        ]}>
          {/* Tape */}
          <View style={styles.tape} />

          {/* Botanical Art */}
          <View style={styles.botanicalPos}>
            <BotanicalArt />
          </View>

          {/* Greeting */}
          <Text style={styles.greetingTitle}>
            {'안녕하세요,\n저는 마무리에요.'}
          </Text>

          <Text style={styles.greetingMessage}>
            {'당신의 하루와 감정을\n이곳에 조용히 담아두세요.\n\n저는 이곳을 지켜보며\n당신의 이야기에 귀 기울일게요.'}
          </Text>

          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <PostalStamp />
            <Text style={styles.signature}>— 마무리</Text>
          </View>
        </Animated.View>

        {/* ── CTA Button ── */}
        <Animated.View style={[
          styles.actionContainer,
          { opacity: btnFade, paddingBottom: insets.bottom + 40 },
        ]}>
          <ScrapbookButton
            title="시작하기"
            variant="outline"
            onPress={() => navigation.replace('Login')}
          />
        </Animated.View>
      </View>
    </PaperBackground>
  );
}

const CARD_WIDTH = Math.min(310, SCREEN_W - 64);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  card: {
    backgroundColor: colors.bgIvory,
    width: CARD_WIDTH,
    borderRadius: borderRadius.xs,
    paddingTop: 50,
    paddingHorizontal: 32,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...shadows.warm,
  },
  tape: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    left: CARD_WIDTH / 2 - 35,
    width: 70,
    height: 22,
    backgroundColor: colors.glassWhiteLight,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
    transform: [{ rotate: '2deg' }],
    zIndex: 20,
  },
  botanicalPos: {
    position: 'absolute',
    top: -25,
    right: -15,
    zIndex: 15,
  },
  greetingTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 39,
    color: colors.textPrimary,
    letterSpacing: -0.56,
    marginBottom: 32,
    zIndex: 10,
  },
  greetingMessage: {
    fontFamily: fontFamily.sans,
    fontSize: 13.5,
    lineHeight: 25.5,
    color: colors.textSecondary,
    letterSpacing: 0.14,
    marginBottom: 60,
    zIndex: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
    zIndex: 10,
  },
  signature: {
    fontFamily: fontFamily.script,
    fontSize: 26,
    color: colors.textPrimary,
    paddingRight: 10,
    transform: [{ rotate: '-2deg' }],
  },
  actionContainer: {
    marginTop: 'auto',
  },
});

export default WelcomeScreenV3;
