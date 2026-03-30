/**
 * EmotionPickerScreen V3 — Scrapbook emotion selection
 *
 * "이제 어떤 감정으로 이 페이지를 시작할지 고르는 순간"
 *
 * Step 1: 5 primary emotion cards — warm blob shapes, serif labels
 * Step 2: Secondary emotion tag chips — on paper surface
 * → Navigate to WriteDiary with selected emotion
 *
 * v3 design system tokens. No react-native-svg.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  colors, fontFamily, shadows, spacing, borderRadius, layout, duration,
} from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import type { EmotionKey } from '../types';
import { useTranslation } from 'react-i18next';
import {
  EMOTION_COLORS, EMOTION_LABELS,
  SECONDARY_TAGS, EMOTION_KEYS,
} from '../constants/stickers';
import { EmotionStickerView } from './components/EmotionStickerView';

type Step = 'primary' | 'secondary';

// Blob shapes for emotion cards — organic, hand-placed feel
const cardBlobRadii = [
  { borderTopLeftRadius: 32, borderTopRightRadius: 40, borderBottomRightRadius: 36, borderBottomLeftRadius: 44 },
  { borderTopLeftRadius: 40, borderTopRightRadius: 32, borderBottomRightRadius: 44, borderBottomLeftRadius: 36 },
  { borderTopLeftRadius: 36, borderTopRightRadius: 44, borderBottomRightRadius: 32, borderBottomLeftRadius: 40 },
  { borderTopLeftRadius: 44, borderTopRightRadius: 36, borderBottomRightRadius: 40, borderBottomLeftRadius: 32 },
  { borderTopLeftRadius: 38, borderTopRightRadius: 38, borderBottomRightRadius: 44, borderBottomLeftRadius: 34 },
  { borderTopLeftRadius: 34, borderTopRightRadius: 44, borderBottomRightRadius: 38, borderBottomLeftRadius: 38 },
];

export default function EmotionPickerScreenV3() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const route = useRoute<any>();

  const { t } = useTranslation();
  const preselected = route.params?.preselectedEmotion as EmotionKey | undefined;

  const [step, setStep] = useState<Step>(preselected ? 'secondary' : 'primary');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey | null>(preselected ?? null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: duration.slow, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: duration.slow, useNativeDriver: true }),
    ]).start();
  }, [step]);

  const handleSelectPrimary = (key: EmotionKey) => {
    setSelectedEmotion(key);
    setSelectedTags([]);
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    setStep('secondary');
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [tag]
    );
  };

  const handleConfirm = () => {
    // Home으로 돌아가면서 감정 기록
    nav.navigate('MainTabs', {
      screen: 'Home',
      params: {
        selectedEmotion,
        selectedTag: selectedTags.length > 0 ? selectedTags[0] : undefined,
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
    <PaperBackground variant="plain" color="cream" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {step === 'primary' ? t('emotion.pickPrimary') : t('emotion.pickSecondary')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {step === 'primary' ? (
            /* ═══ Step 1: Primary emotion cards — blob shapes ═══ */
            <>
              <Text style={s.pageSubtitle}>{t('emotion.pickSubtitle')}</Text>
              <View style={s.cardGrid}>
                {EMOTION_KEYS.map((key, index) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      s.emotionCard,
                      cardBlobRadii[index % cardBlobRadii.length],
                      { backgroundColor: EMOTION_COLORS[key] + '15' },
                    ]}
                    onPress={() => handleSelectPrimary(key)}
                    activeOpacity={0.7}
                  >
                    <EmotionStickerView emotionKey={key} size="large" />
                    <Text style={[s.emotionName, { color: EMOTION_COLORS[key] }]}>
                      {EMOTION_LABELS[key]}
                    </Text>
                  </TouchableOpacity>
                ))}
                {/* "모르겠어요" → 감정 미지정으로 바로 일기 작성 */}
                <TouchableOpacity
                  style={[
                    s.emotionCard,
                    cardBlobRadii[5],
                    { backgroundColor: colors.accentSand + '18' },
                  ]}
                  onPress={() => {
                    nav.navigate('MainTabs', {
                      screen: 'Home',
                      params: { selectedEmotion: undefined, selectedTag: undefined },
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={s.questionMark}>
                    <Text style={s.questionText}>?</Text>
                  </View>
                  <Text style={[s.emotionName, { color: colors.textTertiary }]}>
                    {t('home.unknown')}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* ═══ Step 2: Secondary tags ═══ */
            <>
              {selectedEmotion && (
                <View style={s.selectedHeader}>
                  <View style={[s.selectedBadge, {
                    backgroundColor: EMOTION_COLORS[selectedEmotion] + '15',
                    borderColor: EMOTION_COLORS[selectedEmotion] + '30',
                  }]}>
                    <EmotionStickerView emotionKey={selectedEmotion} size="medium" />
                    <Text style={[s.selectedLabel, { color: EMOTION_COLORS[selectedEmotion] }]}>
                      {selectedTags.length > 0 ? selectedTags[0] : EMOTION_LABELS[selectedEmotion]}
                    </Text>
                  </View>
                </View>
              )}

              <Text style={s.tagPrompt}>{t('emotion.tagPrompt')}</Text>
              <Text style={s.tagSub}>{t('emotion.tagSubSingle')}</Text>

              <View style={s.tagWrap}>
                {selectedEmotion && SECONDARY_TAGS[selectedEmotion].map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        s.tagChip,
                        isSelected
                          ? {
                              backgroundColor: EMOTION_COLORS[selectedEmotion] + '18',
                              borderWidth: 1.5,
                              borderColor: EMOTION_COLORS[selectedEmotion] + '50',
                            }
                          : {
                              backgroundColor: colors.bgIvory,
                              borderWidth: 1,
                              borderColor: colors.accentSand + '40',
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
                            : colors.textSecondary,
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
            <Text style={s.ctaText}>{t('emotion.startWithThis')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </PaperBackground>
  );
}

const s = StyleSheet.create({
  // Header
  header: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: layout.screenPaddingH,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backArrow: {
    fontFamily: fontFamily.sansLight, fontSize: 22, color: colors.textPrimary,
  },
  headerTitle: {
    fontFamily: fontFamily.serifItalic, fontSize: 18, fontWeight: '400',
    color: colors.textPrimary,
  },

  scroll: { paddingHorizontal: spacing['2xl'], paddingBottom: 120 },

  // Page subtitle
  pageSubtitle: {
    fontFamily: fontFamily.sans, fontSize: 14,
    color: colors.textTertiary, textAlign: 'center',
    marginTop: spacing['2xl'], marginBottom: spacing['3xl'],
  },

  // Step 1: Card grid — blob shapes
  cardGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: spacing.lg,
  },
  emotionCard: {
    width: 148, height: 148,
    alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm,
  },
  emotionName: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 15, fontWeight: '600', letterSpacing: -0.3,
  },
  questionMark: {
    width: 48, height: 48, alignItems: 'center', justifyContent: 'center',
  },
  questionText: {
    fontFamily: fontFamily.script, fontSize: 36, color: colors.textTertiary,
  },

  // Step 2: Selected header
  selectedHeader: {
    alignItems: 'center', marginTop: spacing['3xl'], marginBottom: spacing['2xl'],
  },
  selectedBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: borderRadius.full, borderWidth: 1, gap: spacing.sm,
    ...shadows.crisp,
  },
  selectedLabel: {
    fontFamily: fontFamily.sansMedium, fontSize: 16, fontWeight: '600',
  },

  // Tag prompt
  tagPrompt: {
    fontFamily: fontFamily.serifItalic, fontSize: 22, fontWeight: '400',
    color: colors.textPrimary, textAlign: 'center',
    marginBottom: spacing.sm,
  },
  tagSub: {
    fontFamily: fontFamily.sans, fontSize: 13,
    color: colors.textTertiary, textAlign: 'center',
    marginBottom: spacing['2xl'],
  },

  // Tags
  tagWrap: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: spacing.sm,
  },
  tagChip: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontFamily: fontFamily.sans, fontSize: 14,
  },

  // Bottom CTA
  bottomBar: {
    paddingHorizontal: spacing['2xl'], paddingTop: spacing.lg,
    backgroundColor: colors.bgCream,
  },
  ctaButton: {
    height: 54, borderRadius: borderRadius['2xl'],
    alignItems: 'center', justifyContent: 'center',
  },
  ctaText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 16, fontWeight: '600', color: colors.surfacePure,
    letterSpacing: -0.3,
  },
});
