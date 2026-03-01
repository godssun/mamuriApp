import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { companionApi, ApiError } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const AI_TONE_OPTIONS = [
  { value: 'warm' as const, label: '따뜻한', description: '공감하고 위로하는 톤' },
  { value: 'calm' as const, label: '차분한', description: '안정적이고 담담한 톤' },
  { value: 'cheerful' as const, label: '밝은', description: '긍정적이고 활기찬 톤' },
  { value: 'realistic' as const, label: '현실적인', description: '솔직하고 담백한 톤' },
];

const SPEECH_STYLE_OPTIONS = [
  { value: 'formal' as const, label: '존댓말', description: '정중하고 예의 바른 말투' },
  { value: 'casual' as const, label: '반말', description: '편안한 친구 같은 말투' },
];

type ToneValue = 'warm' | 'calm' | 'cheerful' | 'realistic';
type SpeechValue = 'formal' | 'casual';

export default function CompanionSetupScreen() {
  const { completeOnboarding, setCompanionName } = useAuth();
  const { theme } = useTheme();
  const [step, setStep] = useState(0); // 0: 이름, 1: 톤+말투, 2: 사진
  const [aiName, setAiName] = useState('마음이');
  const [aiTone, setAiTone] = useState<ToneValue>('warm');
  const [speechStyle, setSpeechStyle] = useState<SpeechValue>('formal');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handlePickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
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
      // 1. AI 이름 설정
      const trimmedName = aiName.trim() || '마음이';
      await companionApi.updateName({ aiName: trimmedName });
      setCompanionName(trimmedName);

      // 2. 톤 + 말투 설정
      await companionApi.updateSettings({
        aiTone,
        speechStyle,
      });

      // 3. 프로필 사진 업로드 (선택한 경우만)
      if (avatarUri) {
        await companionApi.uploadAvatar(avatarUri);
      }

      completeOnboarding();
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : '설정 저장에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>나만의 친구를 만나보세요</Text>
          <Text style={styles.headerSubtitle}>
            매일 일기를 함께 나눌 친구를 설정해주세요
          </Text>
        </View>

        {/* 스텝 인디케이터 */}
        <View style={styles.stepIndicator}>
          {[0, 1, 2].map((s) => (
            <View
              key={s}
              style={[styles.stepDot, s <= step && styles.stepDotActive]}
            />
          ))}
        </View>

        {step === 0 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>친구의 이름을 지어주세요</Text>
            <Text style={styles.stepDescription}>
              나만의 친구에게 이름을 붙여주세요
            </Text>
            <TextInput
              style={styles.nameInput}
              value={aiName}
              onChangeText={setAiName}
              placeholder="예: 마음이, 소리, 하늘이"
              placeholderTextColor="#999"
              maxLength={20}
              autoFocus
            />
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>친구의 성격을 골라주세요</Text>

            <Text style={styles.optionGroupLabel}>톤</Text>
            <View style={styles.optionGroup}>
              {AI_TONE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    aiTone === option.value && styles.optionCardSelected,
                  ]}
                  onPress={() => setAiTone(option.value)}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      aiTone === option.value && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDesc,
                      aiTone === option.value && styles.optionDescSelected,
                    ]}
                  >
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.optionGroupLabel, { marginTop: 20 }]}>말투</Text>
            <View style={styles.optionGroup}>
              {SPEECH_STYLE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    speechStyle === option.value && styles.optionCardSelected,
                  ]}
                  onPress={() => setSpeechStyle(option.value)}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      speechStyle === option.value && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDesc,
                      speechStyle === option.value && styles.optionDescSelected,
                    ]}
                  >
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>프로필 사진을 설정해보세요</Text>
            <Text style={styles.stepDescription}>
              나중에 설정에서 언제든 변경할 수 있어요
            </Text>

            <TouchableOpacity
              style={styles.avatarPicker}
              onPress={handlePickAvatar}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderIcon}>+</Text>
                  <Text style={styles.avatarPlaceholderText}>탭하여 사진 선택</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        {step < 2 ? (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => setStep(step + 1)}
          >
            <Text style={styles.nextButtonText}>다음</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, isSaving && styles.nextButtonDisabled]}
            onPress={handleComplete}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextButtonText}>시작하기</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>나중에 설정하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5E5',
  },
  stepDotActive: {
    backgroundColor: '#FF9B7A',
    width: 24,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },
  nameInput: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    color: '#2D2D2D',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    textAlign: 'center',
  },
  optionGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 10,
  },
  optionGroup: {
    gap: 8,
  },
  optionCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  optionCardSelected: {
    borderColor: '#FF9B7A',
    backgroundColor: '#FFF0EB',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: '#FF9B7A',
  },
  optionDesc: {
    fontSize: 13,
    color: '#999',
  },
  optionDescSelected: {
    color: '#FF9B7A',
  },
  avatarPicker: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
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
  avatarPlaceholderIcon: {
    fontSize: 36,
    color: '#CCC',
    fontWeight: '300',
  },
  avatarPlaceholderText: {
    fontSize: 14,
    color: '#999',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  nextButton: {
    backgroundColor: '#FF9B7A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#FFD0C2',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#999',
  },
});
