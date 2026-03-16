import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Image,
  Switch,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { companionApi, settingsApi, ApiError } from '../api/client';
import { CompanionProfile, CompanionSettings, UserSettings, MainStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

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

function getAvatarImageUri(avatar: string | null | undefined): string | null {
  if (!avatar || avatar.length === 0) return null;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('/uploads/')) {
    const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return `http://${host}:8080${avatar}`;
  }
  return null; // 이모지 등 비정상 값은 무시
}

export default function CompanionScreen() {
  const mainNavigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { setCompanionName } = useAuth();
  const { theme } = useTheme();
  const [profile, setProfile] = useState<CompanionProfile | null>(null);
  const [companionSettings, setCompanionSettings] = useState<CompanionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isSavingCompanion, setIsSavingCompanion] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const [profileData, companionSettingsData, userSettingsData] = await Promise.all([
        companionApi.getProfile(),
        companionApi.getSettings(),
        settingsApi.get(),
      ]);
      setProfile(profileData);
      setCompanionName(profileData.aiName);
      setCompanionSettings(companionSettingsData);
      setSettings(userSettingsData);
    } catch (error) {
      console.error('Failed to load companion profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNameModal = () => {
    setNewName(profile?.aiName ?? '');
    setShowNameModal(true);
  };

  const handleSaveName = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }

    setIsSavingName(true);
    try {
      const updated = await companionApi.updateName({ aiName: trimmed });
      setProfile(updated);
      setCompanionName(trimmed);
      setShowNameModal(false);
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : '이름 변경에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setIsSavingName(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!settings) return;
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    try {
      await settingsApi.update(newSettings);
    } catch (error) {
      setSettings(settings);
      const message = error instanceof ApiError
        ? error.message
        : '설정 저장에 실패했습니다.';
      Alert.alert('오류', message);
    }
  };

  const updateCompanionSettings = async (updates: Partial<CompanionSettings>) => {
    if (!companionSettings) return;
    const newSettings = { ...companionSettings, ...updates };
    setCompanionSettings(newSettings);
    setIsSavingCompanion(true);
    try {
      const result = await companionApi.updateSettings({
        speechStyle: newSettings.speechStyle,
        aiTone: newSettings.aiTone,
      });
      setCompanionSettings(result);
    } catch (error) {
      setCompanionSettings(companionSettings);
      const message = error instanceof ApiError
        ? error.message
        : '설정 저장에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setIsSavingCompanion(false);
    }
  };

  const toggleAiSettings = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAiSettings(!showAiSettings);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#FF9B7A" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>프로필을 불러올 수 없습니다.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: theme.fontFamily }]}>{profile.aiName}</Text>
        <TouchableOpacity onPress={() => mainNavigation.navigate('Settings')}>
          <Text style={[styles.settingsIcon, { color: theme.colors.textSecondary }]}>설정</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 프로필 카드 */}
        <View style={[styles.profileCard, { backgroundColor: theme.colors.card }]}>
          {getAvatarImageUri(companionSettings?.avatar) ? (
            <Image
              source={{ uri: getAvatarImageUri(companionSettings?.avatar)! }}
              style={styles.profileImage}
              onError={() => setCompanionSettings(prev =>
                prev ? { ...prev, avatar: null } : prev
              )}
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profileInitial}>
                {profile.aiName.charAt(0)}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.nameRow} onPress={handleOpenNameModal}>
            <Text style={[styles.profileName, { color: theme.colors.text, fontFamily: theme.fontFamily }]}>{profile.aiName}</Text>
            <Text style={styles.editIcon}>변경</Text>
          </TouchableOpacity>

          <Text style={[styles.profileDescription, { fontFamily: theme.fontFamily, color: theme.colors.textSecondary }]}>
            누구에게도 말하지 못한 당신의 일상을 공유해주세요
          </Text>
        </View>

        {/* 기록 */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.fontFamily }]}>기록</Text>
        <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.statRow}>
            <View style={styles.statDot} />
            <Text style={[styles.statLabel, { color: theme.colors.text, fontFamily: theme.fontFamily }]}>함께한 일기</Text>
            <Text style={[styles.statValue, { fontFamily: theme.fontFamily }]}>{profile.diaryCount}편</Text>
          </View>
        </View>

        {/* AI 설정 (접었다 폈다) */}
        <TouchableOpacity
          style={styles.settingSectionHeader}
          onPress={toggleAiSettings}
          activeOpacity={0.7}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.fontFamily }]}>AI 코멘트 설정</Text>
          <Text style={[styles.settingChevron, { color: theme.colors.textSecondary }]}>
            {showAiSettings ? '∧' : '∨'}
          </Text>
        </TouchableOpacity>

        {showAiSettings && (
          <View style={styles.settingsContent}>
            <View style={[styles.settingRow, { backgroundColor: theme.colors.card }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: theme.colors.text, fontFamily: theme.fontFamily }]}>AI 코멘트 받기</Text>
                <Text style={[styles.settingDescription, { fontFamily: theme.fontFamily, color: theme.colors.textSecondary }]}>
                  일기 작성 시 AI 코멘트를 받습니다
                </Text>
              </View>
              <Switch
                value={settings?.aiEnabled ?? true}
                onValueChange={(value) => updateSettings({ aiEnabled: value })}
                trackColor={{ false: theme.colors.border, true: '#FFD0C2' }}
                thumbColor={settings?.aiEnabled ? '#FF9B7A' : '#fff'}
              />
            </View>

            <View style={[styles.settingGroup, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.settingLabel, { color: theme.colors.text, fontFamily: theme.fontFamily }]}>AI 톤</Text>
              <View style={styles.toneOptions}>
                {AI_TONE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.toneOption,
                      { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
                      companionSettings?.aiTone === option.value && styles.toneOptionSelected,
                    ]}
                    onPress={() => updateCompanionSettings({ aiTone: option.value })}
                    disabled={isSavingCompanion}
                  >
                    <Text
                      style={[
                        styles.toneLabel,
                        { color: theme.colors.text },
                        companionSettings?.aiTone === option.value && styles.toneLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.toneDescription,
                        { color: theme.colors.textSecondary },
                        companionSettings?.aiTone === option.value && styles.toneDescriptionSelected,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.settingGroup, { marginTop: 12, backgroundColor: theme.colors.card }]}>
              <Text style={[styles.settingLabel, { color: theme.colors.text, fontFamily: theme.fontFamily }]}>말투 스타일</Text>
              <View style={styles.toneOptions}>
                {SPEECH_STYLE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.toneOption,
                      { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
                      companionSettings?.speechStyle === option.value && styles.toneOptionSelected,
                    ]}
                    onPress={() => updateCompanionSettings({ speechStyle: option.value })}
                    disabled={isSavingCompanion}
                  >
                    <Text
                      style={[
                        styles.toneLabel,
                        { color: theme.colors.text },
                        companionSettings?.speechStyle === option.value && styles.toneLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.toneDescription,
                        { color: theme.colors.textSecondary },
                        companionSettings?.speechStyle === option.value && styles.toneDescriptionSelected,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 이름 변경 모달 */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.nameModal, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>이름 변경</Text>
            <TextInput
              style={[styles.nameInput, { backgroundColor: theme.colors.border, color: theme.colors.text, borderColor: theme.colors.border }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="새 이름을 입력해주세요"
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={20}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { backgroundColor: theme.colors.border }]}
                onPress={() => setShowNameModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, isSavingName && styles.modalSaveButtonDisabled]}
                onPress={handleSaveName}
                disabled={isSavingName}
              >
                {isSavingName ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>저장</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F5',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF9B7A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  settingsIcon: {
    fontSize: 15,
    color: '#999',
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  profilePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FF9B7A',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  editIcon: {
    fontSize: 13,
    color: '#FF9B7A',
    fontWeight: '500',
  },
  profileDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF9B7A',
    marginRight: 12,
  },
  statLabel: {
    flex: 1,
    fontSize: 15,
    color: '#2D2D2D',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF9B7A',
  },
  statDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  settingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  settingChevron: {
    fontSize: 14,
    color: '#999',
  },
  settingsContent: {
    gap: 12,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  settingGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#999',
  },
  toneOptions: {
    marginTop: 12,
    gap: 8,
  },
  toneOption: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FAFAFA',
  },
  toneOptionSelected: {
    borderColor: '#FF9B7A',
    backgroundColor: '#FFF0EB',
  },
  toneLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 2,
  },
  toneLabelSelected: {
    color: '#FF9B7A',
  },
  toneDescription: {
    fontSize: 13,
    color: '#999',
  },
  toneDescriptionSelected: {
    color: '#FF9B7A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  nameModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 20,
  },
  nameInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2D2D2D',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#FF9B7A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#FFD0C2',
  },
  modalSaveText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});
