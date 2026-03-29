/**
 * CompanionSetup v3 — Warm scrapbook companion onboarding
 *
 * "AI 친구를 만나기 전, 이름을 붙이고 관계를 시작하는 조용한 준비"
 *
 * 4-step wizard: emotion check-in → name → personality → avatar
 * Paper-textured background, serif prompts, sage accents,
 * ivory option cards, blob avatar shape.
 *
 * v3 design system tokens.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Image, Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { companionApi, ApiError } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { EMOTION_COLORS } from '../constants/stickers';
import {
  colors, fontFamily, shadows, spacing, borderRadius, layout, duration,
} from '../design-system-v3';
import { ScreenContainer } from './components/ScreenContainer';
import { Button } from './components/Button';
import { Input } from './components/Input';

const AI_TONE_OPTIONS = [
  { value: 'warm' as const, labelKey: 'companion.toneWarm', descKey: 'companion.toneWarmDesc' },
  { value: 'calm' as const, labelKey: 'companion.toneCalm', descKey: 'companion.toneCalmDesc' },
  { value: 'cheerful' as const, labelKey: 'companion.toneCheerful', descKey: 'companion.toneCheerfulDesc' },
  { value: 'realistic' as const, labelKey: 'companion.toneRealistic', descKey: 'companion.toneRealisticDesc' },
];

const SPEECH_STYLE_OPTIONS = [
  { value: 'formal' as const, labelKey: 'companion.speechFormal', descKey: 'companion.speechFormalDesc' },
  { value: 'casual' as const, labelKey: 'companion.speechCasual', descKey: 'companion.speechCasualDesc' },
];

type ToneValue = 'warm' | 'calm' | 'cheerful' | 'realistic';
type SpeechValue = 'formal' | 'casual';

// Blob shapes for emotion check-in cards
const emotionBlobRadii = [
  { borderTopLeftRadius: 14, borderTopRightRadius: 18, borderBottomRightRadius: 16, borderBottomLeftRadius: 20 },
  { borderTopLeftRadius: 18, borderTopRightRadius: 14, borderBottomRightRadius: 20, borderBottomLeftRadius: 16 },
  { borderTopLeftRadius: 16, borderTopRightRadius: 20, borderBottomRightRadius: 14, borderBottomLeftRadius: 18 },
  { borderTopLeftRadius: 20, borderTopRightRadius: 16, borderBottomRightRadius: 18, borderBottomLeftRadius: 14 },
  { borderTopLeftRadius: 17, borderTopRightRadius: 17, borderBottomRightRadius: 20, borderBottomLeftRadius: 14 },
];

export function CompanionSetupScreenV2() {
  const { completeOnboarding, setCompanionName } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [aiName, setAiName] = useState('마음이');
  const [aiTone, setAiTone] = useState<ToneValue>('warm');
  const [speechStyle, setSpeechStyle] = useState<SpeechValue>('formal');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: duration.slow, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: duration.slow, useNativeDriver: true }),
    ]).start();
  }, [step]);

  const handlePickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('common.permissionRequired'), t('common.photoPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) setAvatarUri(result.assets[0].uri);
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const trimmedName = aiName.trim() || '마음이';
      await companionApi.updateName({ aiName: trimmedName });
      setCompanionName(trimmedName);
      await companionApi.updateSettings({ aiTone, speechStyle });
      if (avatarUri) await companionApi.uploadAvatar(avatarUri);
      completeOnboarding();
    } catch (error) {
      Alert.alert(t('common.error'), error instanceof ApiError ? error.message : t('companion.settingSaveFailed'));
    } finally { setIsSaving(false); }
  };

  const footer = (
    <View style={s.footer}>
      {step < 3 ? (
        <Button label={step === 0 ? (selectedEmotion ? '다음' : '건너뛰기') : t('companion.setup.next')} variant="primary" size="lg" fullWidth onPress={() => setStep(step + 1)} />
      ) : (
        <Button label={t('companion.setup.startButton')} variant="primary" size="lg" fullWidth onPress={handleComplete} loading={isSaving} />
      )}
      <Button label={t('companion.setup.later')} variant="ghost" onPress={() => completeOnboarding()} fullWidth />
    </View>
  );

  const emotions = [
    { key: 'JOY', label: '좋아요' },
    { key: 'CALM', label: '괜찮아요' },
    { key: 'SAD', label: '별로예요' },
    { key: 'ANXIOUS', label: '힘들어요' },
    { key: 'COMPLEX', label: '복잡해요' },
  ];

  return (
    <ScreenContainer keyboardAvoiding footer={footer}>
      {/* Header */}
      <View style={s.headerSection}>
        <Text style={s.mainTitle}>{t('companion.setup.title')}</Text>
        <Text style={s.subtitle}>{t('companion.setup.subtitle')}</Text>
      </View>

      {/* Step indicator */}
      <View style={s.stepRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[s.stepDot, {
            backgroundColor: i <= step ? colors.accentPrimary : colors.accentSand + '40',
            width: i <= step ? 24 : 8,
          }]} />
        ))}
      </View>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Step 0: Emotion check-in */}
        {step === 0 && (
          <View style={{ alignItems: 'center' }}>
            <Text style={s.stepTitle}>오늘 기분은 어때요?</Text>
            <Text style={s.stepDesc}>매일 이렇게 기분을 기록할 수 있어요</Text>
            <View style={s.emotionGrid}>
              {emotions.map((e, i) => (
                <TouchableOpacity
                  key={e.key}
                  onPress={() => setSelectedEmotion(e.key)}
                  style={[
                    s.emotionCard, emotionBlobRadii[i],
                    {
                      backgroundColor: selectedEmotion === e.key
                        ? (EMOTION_COLORS[e.key as keyof typeof EMOTION_COLORS] || colors.accentPrimary) + '25'
                        : colors.bgIvory,
                      borderWidth: selectedEmotion === e.key ? 1.5 : 1,
                      borderColor: selectedEmotion === e.key
                        ? EMOTION_COLORS[e.key as keyof typeof EMOTION_COLORS] || colors.accentPrimary
                        : colors.accentSand + '30',
                    },
                  ]}
                >
                  <View style={[s.emotionDot, {
                    backgroundColor: EMOTION_COLORS[e.key as keyof typeof EMOTION_COLORS] || colors.accentPrimary,
                  }]} />
                  <Text style={s.emotionLabel}>{e.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedEmotion && (
              <Text style={s.emotionHint}>
                좋아요! 이렇게 매일 감정을 기록하면{'\n'}AI 친구가 당신을 더 잘 이해할 수 있어요
              </Text>
            )}
          </View>
        )}

        {/* Step 1: Name */}
        {step === 1 && (
          <View>
            <Text style={s.stepTitle}>{t('companion.setup.nameStep')}</Text>
            <Text style={s.stepDesc}>{t('companion.setup.nameDesc')}</Text>
            <Input value={aiName} onChangeText={setAiName} placeholder={t('companion.setup.namePlaceholder')} maxLength={20} autoFocus />
          </View>
        )}

        {/* Step 2: Personality */}
        {step === 2 && (
          <View>
            <Text style={s.stepTitle}>{t('companion.setup.personalityStep')}</Text>

            <Text style={s.optionGroupLabel}>{t('companion.setup.tone')}</Text>
            <View style={s.optionList}>
              {AI_TONE_OPTIONS.map((opt) => {
                const sel = aiTone === opt.value;
                return (
                  <TouchableOpacity key={opt.value} style={[s.optionCard, sel ? s.optionSelected : s.optionDefault]} onPress={() => setAiTone(opt.value)}>
                    <Text style={[s.optionLabel, sel && { color: colors.accentPrimary }]}>{t(opt.labelKey)}</Text>
                    <Text style={[s.optionDesc, sel && { color: colors.accentPrimary }]}>{t(opt.descKey)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[s.optionGroupLabel, { marginTop: spacing.xl }]}>{t('companion.setup.speech')}</Text>
            <View style={s.optionList}>
              {SPEECH_STYLE_OPTIONS.map((opt) => {
                const sel = speechStyle === opt.value;
                return (
                  <TouchableOpacity key={opt.value} style={[s.optionCard, sel ? s.optionSelected : s.optionDefault]} onPress={() => setSpeechStyle(opt.value)}>
                    <Text style={[s.optionLabel, sel && { color: colors.accentPrimary }]}>{t(opt.labelKey)}</Text>
                    <Text style={[s.optionDesc, sel && { color: colors.accentPrimary }]}>{t(opt.descKey)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 3: Avatar */}
        {step === 3 && (
          <View style={{ alignItems: 'center' }}>
            <Text style={s.stepTitle}>{t('companion.setup.avatarStep')}</Text>
            <Text style={s.stepDesc}>{t('companion.setup.avatarDesc')}</Text>

            <TouchableOpacity style={s.avatarPicker} onPress={handlePickAvatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={s.avatarImage} />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <Text style={s.avatarPlus}>+</Text>
                  <Text style={s.avatarHint}>{t('companion.setup.tapToSelect')}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </ScreenContainer>
  );
}

export default CompanionSetupScreenV2;

const s = StyleSheet.create({
  // Header
  headerSection: { alignItems: 'center', marginBottom: spacing['3xl'], marginTop: spacing.xl },
  mainTitle: {
    fontFamily: fontFamily.serifItalic, fontSize: 26, fontWeight: '400',
    color: colors.textPrimary, marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fontFamily.sans, fontSize: 14,
    color: colors.textSecondary, textAlign: 'center',
  },

  // Steps
  stepRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing['3xl'] },
  stepDot: { height: 8, borderRadius: borderRadius.full, backgroundColor: colors.accentPrimary },

  stepTitle: {
    fontFamily: fontFamily.serifItalic, fontSize: 20, fontWeight: '400',
    color: colors.textPrimary, marginBottom: spacing.sm, textAlign: 'center',
  },
  stepDesc: {
    fontFamily: fontFamily.sans, fontSize: 13,
    color: colors.textSecondary, marginBottom: spacing['2xl'], textAlign: 'center',
  },

  // Emotion grid
  emotionGrid: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: spacing.md },
  emotionCard: {
    alignItems: 'center', padding: spacing.lg, width: 80, gap: 6,
  },
  emotionDot: { width: 24, height: 24, borderRadius: 12 },
  emotionLabel: { fontFamily: fontFamily.sans, fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  emotionHint: {
    fontFamily: fontFamily.sans, fontSize: 13,
    color: colors.accentPrimary, marginTop: spacing.xl, textAlign: 'center', lineHeight: 20,
  },

  // Option cards
  optionGroupLabel: {
    fontFamily: fontFamily.sansMedium, fontSize: 13, fontWeight: '500',
    color: colors.textSecondary, marginBottom: spacing.sm,
  },
  optionList: { gap: spacing.sm },
  optionCard: { padding: 14, borderWidth: 1, borderRadius: borderRadius.sm },
  optionDefault: { borderColor: colors.accentSand + '40', backgroundColor: colors.surfaceCard },
  optionSelected: { borderColor: colors.accentPrimary, backgroundColor: colors.accentPrimaryLight + '15' },
  optionLabel: { fontFamily: fontFamily.sansMedium, fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  optionDesc: { fontFamily: fontFamily.sans, fontSize: 12, color: colors.textSecondary },

  // Avatar
  avatarPicker: {
    width: 160, height: 160,
    borderTopLeftRadius: 56, borderTopRightRadius: 68,
    borderBottomRightRadius: 60, borderBottomLeftRadius: 72,
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.accentSand + '50',
    backgroundColor: colors.bgIvory,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  avatarImage: { width: 160, height: 160, borderRadius: 80 },
  avatarPlaceholder: { alignItems: 'center', gap: 8 },
  avatarPlus: { fontFamily: fontFamily.sansLight, fontSize: 36, color: colors.textTertiary },
  avatarHint: { fontFamily: fontFamily.sans, fontSize: 12, color: colors.textTertiary },

  // Footer
  footer: { paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing['4xl'], gap: spacing.md },
});
