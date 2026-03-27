/**
 * Design System v2 — Companion Setup (Onboarding)
 *
 * 3-step wizard: name → tone/style → avatar
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { companionApi, ApiError } from '../api/client';
import { primaryEmotionColors } from '../design-system-v2/colors';
import { useAuth } from '../contexts/AuthContext';
import { useThemeV2 } from '../design-system-v2';
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

export function CompanionSetupScreenV2() {
  const { completeOnboarding, setCompanionName } = useAuth();
  const { t } = useTranslation();
  const { theme } = useThemeV2();
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
      Animated.spring(fadeAnim, { toValue: 1, ...theme.springs.gentle, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, ...theme.springs.gentle, useNativeDriver: true }),
    ]).start();
  }, [step]);

  const handlePickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('common.permissionRequired'), t('common.photoPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const trimmedName = aiName.trim() || '마음이';
      await companionApi.updateName({ aiName: trimmedName });
      setCompanionName(trimmedName);
      await companionApi.updateSettings({ aiTone, speechStyle });
      if (avatarUri) {
        await companionApi.uploadAvatar(avatarUri);
      }
      completeOnboarding();
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : t('companion.settingSaveFailed');
      Alert.alert(t('common.error'), message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const footer = (
    <View style={{ paddingHorizontal: theme.layout.screenPaddingH, paddingBottom: theme.spacing['4xl'], gap: theme.spacing.md }}>
      {step < 3 ? (
        <Button label={step === 0 ? (selectedEmotion ? '다음' : '건너뛰기') : t('companion.setup.next')} variant="primary" size="lg" fullWidth onPress={() => setStep(step + 1)} />
      ) : (
        <Button label={t('companion.setup.startButton')} variant="primary" size="lg" fullWidth onPress={handleComplete} loading={isSaving} />
      )}
      <Button label={t('companion.setup.later')} variant="ghost" onPress={handleSkip} fullWidth />
    </View>
  );

  return (
    <ScreenContainer keyboardAvoiding footer={footer}>
      {/* 헤더 */}
      <View style={{ alignItems: 'center', marginBottom: theme.spacing['3xl'], marginTop: theme.spacing.xl }}>
        <Text style={[theme.typography.headlineLarge, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>
          {t('companion.setup.title')}
        </Text>
        <Text style={[theme.typography.bodyMedium, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
          {t('companion.setup.subtitle')}
        </Text>
      </View>

      {/* 스텝 인디케이터 */}
      <View style={[styles.stepIndicator, { marginBottom: theme.spacing['3xl'] }]}>
        {[0, 1, 2, 3].map((s) => (
          <View
            key={s}
            style={[
              styles.stepDot,
              {
                backgroundColor: s <= step ? theme.colors.primary : theme.colors.border,
                borderRadius: theme.borderRadius.full,
                width: s <= step ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Step 0: 감정 체크인 체험 */}
        {step === 0 && (
          <View style={{ alignItems: 'center' }}>
            <Text style={[theme.typography.titleLarge, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm, textAlign: 'center' }]}>
              오늘 기분은 어때요?
            </Text>
            <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginBottom: theme.spacing['2xl'], textAlign: 'center' }]}>
              매일 이렇게 기분을 기록할 수 있어요
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
              {([
                { key: 'JOY', emoji: '😊', label: '좋아요' },
                { key: 'CALM', emoji: '😌', label: '괜찮아요' },
                { key: 'SAD', emoji: '😢', label: '별로예요' },
                { key: 'ANXIOUS', emoji: '😰', label: '힘들어요' },
                { key: 'COMPLEX', emoji: '🤔', label: '복잡해요' },
              ]).map((e) => (
                <TouchableOpacity
                  key={e.key}
                  onPress={() => setSelectedEmotion(e.key)}
                  style={{
                    alignItems: 'center', padding: 16, borderRadius: 16, width: 80,
                    backgroundColor: selectedEmotion === e.key
                      ? (primaryEmotionColors[e.key as keyof typeof primaryEmotionColors] || theme.colors.primarySubtle) + '30'
                      : theme.colors.surfaceSecondary,
                    borderWidth: selectedEmotion === e.key ? 2 : 0,
                    borderColor: primaryEmotionColors[e.key as keyof typeof primaryEmotionColors] || theme.colors.primary,
                  }}
                >
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: (primaryEmotionColors[e.key as keyof typeof primaryEmotionColors] || '#6356D9'), marginBottom: 6 }} />
                  <Text style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' }}>{e.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedEmotion && (
              <Text style={[theme.typography.bodySmall, { color: theme.colors.primary, marginTop: theme.spacing.xl, textAlign: 'center' }]}>
                좋아요! 이렇게 매일 감정을 기록하면{'\n'}AI 친구가 당신을 더 잘 이해할 수 있어요
              </Text>
            )}
          </View>
        )}

        {/* Step 1: 동반자 이름 */}
        {step === 1 && (
          <View>
            <Text style={[theme.typography.titleLarge, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>
              {t('companion.setup.nameStep')}
            </Text>
            <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginBottom: theme.spacing['2xl'] }]}>
              {t('companion.setup.nameDesc')}
            </Text>
            <Input
              value={aiName}
              onChangeText={setAiName}
              placeholder={t('companion.setup.namePlaceholder')}
              maxLength={20}
              autoFocus
            />
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={[theme.typography.titleLarge, { color: theme.colors.textPrimary, marginBottom: theme.spacing.xl }]}>
              {t('companion.setup.personalityStep')}
            </Text>

            <Text style={[theme.typography.labelMedium, { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }]}>{t('companion.setup.tone')}</Text>
            <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.xl }}>
              {AI_TONE_OPTIONS.map((option) => {
                const isSelected = aiTone === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionCard,
                      {
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        backgroundColor: isSelected ? theme.colors.primarySubtle : theme.colors.surface,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}
                    onPress={() => setAiTone(option.value)}
                  >
                    <Text style={[
                      theme.typography.titleSmall,
                      { color: isSelected ? theme.colors.primary : theme.colors.textPrimary },
                    ]}>
                      {t(option.labelKey)}
                    </Text>
                    <Text style={[
                      theme.typography.bodySmall,
                      { color: isSelected ? theme.colors.primary : theme.colors.textSecondary },
                    ]}>
                      {t(option.descKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[theme.typography.labelMedium, { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }]}>{t('companion.setup.speech')}</Text>
            <View style={{ gap: theme.spacing.sm }}>
              {SPEECH_STYLE_OPTIONS.map((option) => {
                const isSelected = speechStyle === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionCard,
                      {
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        backgroundColor: isSelected ? theme.colors.primarySubtle : theme.colors.surface,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}
                    onPress={() => setSpeechStyle(option.value)}
                  >
                    <Text style={[
                      theme.typography.titleSmall,
                      { color: isSelected ? theme.colors.primary : theme.colors.textPrimary },
                    ]}>
                      {t(option.labelKey)}
                    </Text>
                    <Text style={[
                      theme.typography.bodySmall,
                      { color: isSelected ? theme.colors.primary : theme.colors.textSecondary },
                    ]}>
                      {t(option.descKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={{ alignItems: 'center' }}>
            <Text style={[theme.typography.titleLarge, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>
              {t('companion.setup.avatarStep')}
            </Text>
            <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginBottom: theme.spacing['2xl'] }]}>
              {t('companion.setup.avatarDesc')}
            </Text>

            <TouchableOpacity
              style={[styles.avatarPicker, {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.full,
              }]}
              onPress={handlePickAvatar}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={[{ fontSize: 36, color: theme.colors.textDisabled, fontWeight: '300' }]}>+</Text>
                  <Text style={[theme.typography.bodySmall, { color: theme.colors.textTertiary }]}>
                    {t('companion.setup.tapToSelect')}
                  </Text>
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

const styles = StyleSheet.create({
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  stepDot: {
    height: 8,
  },
  optionCard: {
    padding: 14,
    borderWidth: 1,
  },
  avatarPicker: {
    width: 160,
    height: 160,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
});
