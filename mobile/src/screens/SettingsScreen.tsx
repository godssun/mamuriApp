import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTheme } from '../contexts/ThemeContext';
import { companionApi, ApiError } from '../api/client';
import { CompanionProfile, CompanionSettings, MainStackParamList } from '../types';
import DeleteAccountModal from '../components/settings/DeleteAccountModal';

function getAvatarImageUri(avatar: string | null | undefined): string | null {
  if (!avatar || avatar.length === 0) return null;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('/uploads/')) {
    const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return `http://${host}:8080${avatar}`;
  }
  return null; // 이모지 등 비정상 값은 무시
}

const THEME_OPTIONS = [
  { value: 'warm' as const, label: '따뜻한', bg: '#FFF9F5', border: '#F0F0F0' },
  { value: 'light' as const, label: '밝은', bg: '#FFFFFF', border: '#E5E5E5' },
  { value: 'dark' as const, label: '어두운', bg: '#1A1A2E', border: '#2A2A4E' },
];

const FONT_SIZE_OPTIONS = [
  { value: 'small' as const, label: '작게', scale: 0.9 },
  { value: 'medium' as const, label: '보통', scale: 1.0 },
  { value: 'large' as const, label: '크게', scale: 1.15 },
];

const FONT_FAMILY_OPTIONS = [
  { value: 'system' as const, label: '기본', font: undefined as string | undefined },
  { value: 'serif' as const, label: '명조', font: 'NanumMyeongjo_400Regular' as string | undefined },
];

export default function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { logout, forceLogout } = useAuth();
  const { isPremium } = useSubscription();
  const { theme, updateAppearance } = useTheme();
  const [companion, setCompanion] = useState<CompanionProfile | null>(null);
  const [companionSettings, setCompanionSettings] = useState<CompanionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newAiName, setNewAiName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [companionData, companionSettingsData] = await Promise.all([
        companionApi.getProfile(),
        companionApi.getSettings(),
      ]);
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
      '기본 프로필로 되돌리시겠어요?',
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
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#FF9B7A" />
      </View>
    );
  }

  const avatarUrl = getAvatarImageUri(companionSettings?.avatar);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>설정</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* 프로필 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{companion?.aiName ?? '친구'}</Text>

          <View style={[styles.profileCard, { backgroundColor: theme.colors.card }]}>
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
                <Text style={styles.profileAvatarInitial}>
                  {companion?.aiName?.charAt(0) ?? '?'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <TouchableOpacity style={styles.profileNameRow} onPress={handleOpenNameModal}>
                <Text style={styles.profileName}>{companion?.aiName ?? '마음이'}</Text>
                <Text style={styles.profileEditText}>변경</Text>
              </TouchableOpacity>
              <Text style={styles.profileSub}>
                {avatarUrl ? '사진 탭하여 변경' : '사진 탭하여 설정'}
              </Text>
              {avatarUrl && (
                <TouchableOpacity onPress={handleRemoveAvatar} disabled={isUploadingAvatar}>
                  <Text style={styles.profileResetText}>기본 프로필로 되돌리기</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* 외관 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>외관</Text>

          {/* 배경 테마 */}
          <View style={[styles.settingRow, { backgroundColor: theme.colors.card }]}>
            <View style={styles.settingRowLeft}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>배경 테마</Text>
              <View style={styles.themePreviewRow}>
                {THEME_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.themeCircle,
                      { backgroundColor: opt.bg, borderColor: opt.border },
                      theme.colors.background === opt.bg && styles.themeCircleSelected,
                    ]}
                    onPress={() => updateAppearance({ backgroundTheme: opt.value })}
                  >
                    {theme.colors.background === opt.bg && (
                      <View style={[
                        styles.themeCheckDot,
                        { backgroundColor: opt.value === 'dark' ? '#E8E8E8' : '#FF9B7A' },
                      ]} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* 글자 크기 */}
          <View style={[styles.settingRow, { backgroundColor: theme.colors.card }]}>
            <View style={styles.settingRowLeft}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>글자 크기</Text>
              <View style={styles.optionRow}>
                {FONT_SIZE_OPTIONS.map((opt) => {
                  const currentSize = theme.fontScale === 0.9 ? 'small' : theme.fontScale === 1.15 ? 'large' : 'medium';
                  const isSelected = currentSize === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.fontSizeCard,
                        { borderColor: theme.colors.border },
                        isSelected && styles.fontSizeCardSelected,
                      ]}
                      onPress={() => updateAppearance({ fontSize: opt.value })}
                    >
                      <Text style={[
                        styles.fontSizeLabel,
                        { color: theme.colors.textSecondary },
                        isSelected && { color: '#FF9B7A' },
                      ]}>
                        {opt.label}
                      </Text>
                      <Text style={{
                        fontSize: Math.round(16 * opt.scale),
                        color: theme.colors.text,
                        fontFamily: theme.fontFamily,
                      }}>
                        가나다라
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* 글자 폰트 */}
          <View style={[styles.settingRow, { backgroundColor: theme.colors.card }]}>
            <View style={styles.settingRowLeft}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>글자 폰트</Text>
              <View style={styles.optionRow}>
                {FONT_FAMILY_OPTIONS.map((opt) => {
                  const isSelected = (theme.fontFamily === undefined && opt.value === 'system')
                    || (theme.fontFamily === 'serif' && opt.value === 'serif');
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.fontFamilyCard,
                        { borderColor: theme.colors.border },
                        isSelected && styles.fontFamilyCardSelected,
                      ]}
                      onPress={() => updateAppearance({ fontFamily: opt.value })}
                    >
                      <Text style={[
                        styles.fontFamilyLabel,
                        { color: theme.colors.textSecondary },
                        isSelected && { color: '#FF9B7A' },
                      ]}>
                        {opt.label}
                      </Text>
                      <Text style={{
                        fontSize: 15,
                        fontFamily: opt.font,
                        color: theme.colors.text,
                      }}>
                        오늘 하루는 어떠셨나요
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* 미리보기 */}
          <View style={[styles.previewCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.previewLabel, { color: theme.colors.textSecondary }]}>미리보기</Text>
            <Text style={{
              fontSize: Math.round(16 * theme.fontScale),
              fontFamily: theme.fontFamily,
              color: theme.colors.text,
              lineHeight: Math.round(26 * theme.fontScale),
            }}>
              오늘 하루는 참 좋았어요.{'\n'}내일은 더 좋은 하루가 될 거예요.
            </Text>
          </View>
        </View>

        {/* 구독 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>구독</Text>

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

          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <Text style={styles.deleteAccountText}>계정 삭제</Text>
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
            <Text style={styles.modalTitle}>이름 변경</Text>
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

      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleted={forceLogout}
        isPremium={isPremium}
      />
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
  profileAvatarInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF9B7A',
  },
  profileAvatarLoading: {
    width: 68,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
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
  profileEditText: {
    fontSize: 13,
    color: '#FF9B7A',
    fontWeight: '500',
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
  deleteAccountButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteAccountText: {
    fontSize: 14,
    color: '#999',
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
  themePreviewRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  themeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeCircleSelected: {
    borderColor: '#FF9B7A',
    borderWidth: 2.5,
  },
  themeCheckDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#FAFAFA',
  },
  optionChipSelected: {
    borderColor: '#FF9B7A',
    backgroundColor: '#FFF0EB',
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionChipTextSelected: {
    color: '#FF9B7A',
  },
  fontSizeCard: {
    flex: 1,
    alignItems: 'center' as const,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FAFAFA',
    gap: 6,
  },
  fontSizeCardSelected: {
    borderColor: '#FF9B7A',
    backgroundColor: '#FFF0EB',
  },
  fontSizeLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  fontFamilyCard: {
    flex: 1,
    alignItems: 'center' as const,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FAFAFA',
    gap: 4,
  },
  fontFamilyCardSelected: {
    borderColor: '#FF9B7A',
    backgroundColor: '#FFF0EB',
  },
  fontFamilyLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  previewCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginBottom: 8,
  },
});
