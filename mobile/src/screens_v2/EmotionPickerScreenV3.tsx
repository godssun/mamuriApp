/**
 * EmotionPickerScreen V3 — 2-step emotion selection
 *
 * Step 1: 5 primary emotion cards (grid)
 * Step 2: Secondary emotion tag chips
 * → Navigate to WriteDiary with selected emotion
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Animated, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeV2 } from '../design-system-v2';
import type { Theme } from '../design-system-v2';
import type { EmotionKey } from '../types';
import {
  EMOTION_COLORS, EMOTION_LABELS,
  SECONDARY_TAGS, EMOTION_KEYS, EMOTION_STICKER_IMAGES,
} from '../constants/stickers';

type Step = 'primary' | 'secondary';

export default function EmotionPickerScreenV3() {
  const { theme } = useThemeV2();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const s = makeStyles(theme);

  const preselected = route.params?.preselectedEmotion as EmotionKey | undefined;

  const [step, setStep] = useState<Step>(preselected ? 'secondary' : 'primary');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey | null>(preselected ?? null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [step]);

  const handleSelectPrimary = (key: EmotionKey) => {
    setSelectedEmotion(key);
    setSelectedTags([]);
    // Animate transition to step 2
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    setStep('secondary');
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleConfirm = () => {
    nav.navigate('DiaryList', {
      screen: 'WriteDiary',
      params: {
        selectedEmotion,
        secondaryTags: selectedTags,
      },
    });
  };

  const handleBack = () => {
    if (step === 'secondary' && !preselected) {
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
      setStep('primary');
    } else {
      nav.goBack();
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {step === 'primary' ? '지금 기분이 어때요?' : '조금 더 알려주세요'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {step === 'primary' ? (
            /* Step 1: Primary emotion cards */
            <View style={s.cardGrid}>
              {EMOTION_KEYS.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[s.emotionCard, { backgroundColor: EMOTION_COLORS[key] + '20' }]}
                  onPress={() => handleSelectPrimary(key)}
                  activeOpacity={0.7}
                >
                  <View style={[s.emotionImageWrap, { backgroundColor: EMOTION_COLORS[key] + '25' }]}>
                    <Image source={EMOTION_STICKER_IMAGES[key]} style={s.emotionImage} />
                  </View>
                  <Text style={[s.emotionName, { color: EMOTION_COLORS[key] }]}>
                    {EMOTION_LABELS[key]}
                  </Text>
                </TouchableOpacity>
              ))}
              {/* "모르겠어요" placeholder */}
              <TouchableOpacity
                style={[s.emotionCard, { backgroundColor: theme.colors.surfaceSecondary }]}
                onPress={() => handleSelectPrimary('COMPLEX')}
                activeOpacity={0.7}
              >
                <View style={[s.emotionImageWrap, { backgroundColor: theme.colors.border + '30' }]}>
                  <Text style={{ fontSize: 32, fontWeight: '300', color: theme.colors.textTertiary }}>?</Text>
                </View>
                <Text style={[s.emotionName, { color: theme.colors.textTertiary }]}>
                  모르겠어요
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Step 2: Secondary tags */
            <>
              {selectedEmotion && (
                <View style={s.selectedHeader}>
                  <View style={[s.selectedBadge, { backgroundColor: EMOTION_COLORS[selectedEmotion] + '20' }]}>
                    <Image source={EMOTION_STICKER_IMAGES[selectedEmotion]} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
                    <Text style={[s.selectedLabel, { color: EMOTION_COLORS[selectedEmotion] }]}>
                      {EMOTION_LABELS[selectedEmotion]}
                    </Text>
                  </View>
                </View>
              )}

              <Text style={s.tagPrompt}>어떤 감정에 가까운가요?</Text>
              <Text style={s.tagSub}>여러 개 선택할 수 있어요</Text>

              <View style={s.tagWrap}>
                {selectedEmotion && SECONDARY_TAGS[selectedEmotion].map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        s.tagChip,
                        {
                          backgroundColor: isSelected
                            ? EMOTION_COLORS[selectedEmotion] + '25'
                            : theme.colors.surfaceSecondary,
                          borderWidth: isSelected ? 1.5 : 0,
                          borderColor: isSelected ? EMOTION_COLORS[selectedEmotion] : 'transparent',
                        },
                      ]}
                      onPress={() => handleToggleTag(tag)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        s.tagText,
                        {
                          color: isSelected
                            ? EMOTION_COLORS[selectedEmotion]
                            : theme.colors.textSecondary,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom CTA (step 2 only) */}
      {step === 'secondary' && selectedEmotion && (
        <View style={[s.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[s.ctaButton, { backgroundColor: EMOTION_COLORS[selectedEmotion] }]}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Text style={s.ctaText}>이 감정으로 시작하기</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    header: {
      height: 56, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', paddingHorizontal: t.layout.screenPaddingH,
    },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    backText: { ...t.typography.titleLarge, color: t.colors.textPrimary },
    headerTitle: { ...t.typography.titleSmall, color: t.colors.textPrimary, fontWeight: '600' },

    scroll: { paddingHorizontal: t.spacing['2xl'], paddingBottom: 120 },

    // Step 1: Card grid
    cardGrid: {
      flexDirection: 'row', flexWrap: 'wrap',
      justifyContent: 'center', gap: t.spacing.md,
      marginTop: t.spacing['4xl'],
    },
    emotionCard: {
      width: 148, height: 148,
      borderRadius: t.borderRadius.xl,
      alignItems: 'center', justifyContent: 'center',
      gap: t.spacing.sm,
    },
    emotionIcon: { fontSize: 40 },
    emotionImageWrap: {
      width: 64, height: 64, borderRadius: 32,
      alignItems: 'center' as const, justifyContent: 'center' as const,
      overflow: 'hidden' as const,
    },
    emotionImage: { width: 60, height: 60, resizeMode: 'contain' as const },
    emotionName: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },

    // Step 2: Selected header
    selectedHeader: { alignItems: 'center', marginTop: t.spacing['3xl'], marginBottom: t.spacing['2xl'] },
    selectedBadge: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 12,
      borderRadius: t.borderRadius.full, gap: 8,
    },
    selectedIcon: { fontSize: 24 },
    selectedLabel: { fontSize: 16, fontWeight: '700' },

    tagPrompt: {
      ...t.typography.headlineMedium, color: t.colors.textPrimary,
      textAlign: 'center', marginBottom: t.spacing.sm,
    },
    tagSub: {
      ...t.typography.bodySmall, color: t.colors.textTertiary,
      textAlign: 'center', marginBottom: t.spacing['2xl'],
    },

    tagWrap: {
      flexDirection: 'row', flexWrap: 'wrap',
      justifyContent: 'center', gap: t.spacing.sm,
    },
    tagChip: {
      paddingHorizontal: 18, paddingVertical: 10,
      borderRadius: t.borderRadius.full,
    },
    tagText: { fontSize: 14 },

    // Bottom CTA
    bottomBar: {
      paddingHorizontal: t.spacing['2xl'], paddingTop: t.spacing.lg,
      backgroundColor: t.colors.background,
    },
    ctaButton: {
      height: 54, borderRadius: t.borderRadius.lg,
      alignItems: 'center', justifyContent: 'center',
    },
    ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  });
}
