import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { settingsApi, companionApi, ApiError } from '../api/client';
import { UserSettings, CompanionProfile, CompanionSettings, MainStackParamList } from '../types';
import { getCompanionConfig } from '../constants/companion';

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
  if (avatar.startsWith('/uploads/')) return `http://localhost:8080${avatar}`;
  return null; // 이모지 등 비정상 값은 무시
}

export default function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { logout } = useAuth();
  const { isPremium } = useSubscription();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [companion, setCompanion] = useState<CompanionProfile | null>(null);
  const [companionSettings, setCompanionSettings] = useState<CompanionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingCompanion, setIsSavingCompanion] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newAiName, setNewAiName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [settingsData, companionData, companionSettingsData] = await Promise.all([
        settingsApi.get(),
        companionApi.getProfile(),
        companionApi.getSettings(),
      ]);
      setSettings(settingsData);
      setCompanion(companionData);
      setCompanionSettings(companionSettingsData);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!settings) return;

    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    setIsSaving(true);

    try {
      await settingsApi.update(newSettings);
    } catch (error) {
      setSettings(settings);
      const message = error instanceof ApiError
        ? error.message
        : '설정 저장에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setIsSaving(false);
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

    if (result.canceled || !result.assets?.[0]) return;

    setIsUploadingAvatar(true);
    try {
      const updated = await companionApi.uploadAvatar(result.assets[0].uri);
      setCompanionSettings(updated);
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : '프로필 사진 업로드에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    Alert.alert(
      '프로필 사진 삭제',
      '기본 이모지로 되돌리시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            setIsUploadingAvatar(true);
            try {
              const updated = await companionApi.removeAvatar();
              setCompanionSettings(updated);
            } catch (error) {
              const message = error instanceof ApiError
                ? error.message
                : '프로필 사진 삭제에 실패했습니다.';
              Alert.alert('오류', message);
            } finally {
              setIsUploadingAvatar(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenNameModal = () => {
    setNewAiName(companion?.aiName ?? '');
    setShowNameModal(true);
  };

  const handleSaveAiName = async () => {
    const trimmed = newAiName.trim();
    if (!trimmed) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }

    setIsSavingName(true);
    try {
      const updated = await companionApi.updateName({ aiName: trimmed });
      setCompanion(updated);
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

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9B7A" />
      </View>
    );
  }

  const avatarUrl = getAvatarImageUri(companionSettings?.avatar);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* AI 친구 프로필 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 친구</Text>

          <View style={styles.profileCard}>
            <TouchableOpacity
              style={styles.profileAvatarWrap}
              onPress={handlePickAvatar}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <View style={styles.profileAvatarLoading}>
                  <ActivityIndicator size="small" color="#FF9B7A" />
                </View>
              ) : avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.profileAvatarImage}
                  onError={() => setCompanionSettings(prev =>
                    prev ? { ...prev, avatar: null } : prev
                  )}
                />
              ) : (
                <Text style={styles.profileAvatarEmoji}>
                  {companion ? getCompanionConfig(companion.level).emoji : '🌱'}
                </Text>
              )}
              <View style={styles.profileAvatarBadge}>
                <Text style={styles.profileAvatarBadgeText}>📷</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <TouchableOpacity style={styles.profileNameRow} onPress={handleOpenNameModal}>
                <Text style={styles.profileName}>{companion?.aiName ?? '마음이'}</Text>
                <Text style={styles.profileEditIcon}>✏️</Text>
              </TouchableOpacity>
              <Text style={styles.profileSub}>
                {avatarUrl ? '사진 탭하여 변경' : '사진 탭하여 설정'}
              </Text>
              {avatarUrl && (
                <TouchableOpacity onPress={handleRemoveAvatar} disabled={isUploadingAvatar}>
                  <Text style={styles.profileResetText}>기본 이모지로 되돌리기</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* AI 코멘트 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 코멘트</Text>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>AI 코멘트 받기</Text>
              <Text style={styles.settingDescription}>
                일기 작성 시 AI 코멘트를 받습니다
              </Text>
            </View>
            <Switch
              value={settings?.aiEnabled ?? true}
              onValueChange={(value) => updateSettings({ aiEnabled: value })}
              trackColor={{ false: '#E5E5E5', true: '#FFD0C2' }}
              thumbColor={settings?.aiEnabled ? '#FF9B7A' : '#fff'}
            />
          </View>

          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>AI 톤</Text>
            <View style={styles.toneOptions}>
              {AI_TONE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.toneOption,
                    companionSettings?.aiTone === option.value && styles.toneOptionSelected,
                  ]}
                  onPress={() => updateCompanionSettings({ aiTone: option.value })}
                  disabled={isSavingCompanion}
                >
                  <Text
                    style={[
                      styles.toneLabel,
                      companionSettings?.aiTone === option.value && styles.toneLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.toneDescription,
                      companionSettings?.aiTone === option.value && styles.toneDescriptionSelected,
                    ]}
                  >
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.settingGroup, { marginTop: 12 }]}>
            <Text style={styles.settingLabel}>말투 스타일</Text>
            <View style={styles.toneOptions}>
              {SPEECH_STYLE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.toneOption,
                    companionSettings?.speechStyle === option.value && styles.toneOptionSelected,
                  ]}
                  onPress={() => updateCompanionSettings({ speechStyle: option.value })}
                  disabled={isSavingCompanion}
                >
                  <Text
                    style={[
                      styles.toneLabel,
                      companionSettings?.speechStyle === option.value && styles.toneLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.toneDescription,
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

        {/* 구독 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>구독</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('Subscription')}
          >
            <View style={styles.settingRowLeft}>
              <Text style={styles.settingLabel}>구독 관리</Text>
              <Text style={styles.settingDescription}>
                {isPremium ? '프리미엄 이용 중' : '무료 플랜'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 계정 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </View>

        {/* 앱 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱 정보</Text>
          <Text style={styles.versionText}>마무리 v1.0.0</Text>
          <Text style={styles.disclaimerText}>
            AI 코멘트는 외부 LLM API를 통해 생성됩니다.{'\n'}
            전문적인 상담이 필요한 경우 전문가의 도움을 받으세요.
          </Text>
        </View>
      </ScrollView>

      {/* AI 이름 변경 모달 */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.nameModal}>
            <Text style={styles.modalTitle}>AI 친구 이름 변경</Text>
            <TextInput
              style={styles.nameInput}
              value={newAiName}
              onChangeText={setNewAiName}
              placeholder="새 이름을 입력해주세요"
              placeholderTextColor="#999"
              maxLength={20}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowNameModal(false)}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, isSavingName && styles.modalSaveButtonDisabled]}
                onPress={handleSaveAiName}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    fontSize: 16,
    color: '#FF9B7A',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  headerSpacer: {
    width: 50,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingRowLeft: {
    flex: 1,
  },
  chevron: {
    fontSize: 20,
    color: '#CCC',
    marginLeft: 8,
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  profileAvatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  profileAvatarEmoji: {
    fontSize: 36,
  },
  profileAvatarLoading: {
    width: 68,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileAvatarBadgeText: {
    fontSize: 10,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  profileEditIcon: {
    fontSize: 14,
  },
  profileSub: {
    fontSize: 13,
    color: '#999',
  },
  profileResetText: {
    fontSize: 12,
    color: '#FF9B7A',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  versionText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#BBB',
    lineHeight: 20,
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
