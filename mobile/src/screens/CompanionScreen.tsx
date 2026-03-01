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
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { companionApi, ApiError } from '../api/client';
import { CompanionProfile, CompanionSettings, MainStackParamList } from '../types';
import { getCompanionConfig, calculateProgress } from '../constants/companion';
import { ProgressBar } from '../components/companion';

function getAvatarImageUri(avatar: string | null | undefined): string | null {
  if (!avatar || avatar.length === 0) return null;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('/uploads/')) return `http://localhost:8080${avatar}`;
  return null; // 이모지 등 비정상 값은 무시
}

export default function CompanionScreen() {
  const mainNavigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [profile, setProfile] = useState<CompanionProfile | null>(null);
  const [companionSettings, setCompanionSettings] = useState<CompanionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const [profileData, settingsData] = await Promise.all([
        companionApi.getProfile(),
        companionApi.getSettings(),
      ]);
      setProfile(profileData);
      setCompanionSettings(settingsData);
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9B7A" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>프로필을 불러올 수 없습니다.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const config = getCompanionConfig(profile.level);
  const progress = calculateProgress(
    profile.diaryCount,
    profile.nextLevelDiaryCount,
    profile.maxLevel,
    profile.level,
  );
  const remaining = profile.maxLevel
    ? 0
    : profile.nextLevelDiaryCount - profile.diaryCount;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI 친구</Text>
        <TouchableOpacity onPress={() => mainNavigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          {getAvatarImageUri(companionSettings?.avatar) ? (
            <Image
              source={{ uri: getAvatarImageUri(companionSettings?.avatar)! }}
              style={styles.profileImage}
              onError={() => setCompanionSettings(prev =>
                prev ? { ...prev, avatar: null } : prev
              )}
            />
          ) : (
            <Text style={styles.profileEmoji}>{config.emoji}</Text>
          )}

          <TouchableOpacity style={styles.nameRow} onPress={handleOpenNameModal}>
            <Text style={styles.profileName}>{profile.aiName}</Text>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>

          <Text style={styles.levelBadge}>
            Lv.{profile.level} {config.title}
          </Text>

          <View style={styles.progressSection}>
            <ProgressBar progress={progress} />
            <Text style={styles.progressText}>
              {profile.maxLevel
                ? '최고 레벨 달성!'
                : `${profile.diaryCount} / ${profile.nextLevelDiaryCount}편`}
            </Text>
          </View>

          <Text style={styles.profileDescription}>{config.description}</Text>
        </View>

        {/* 성장 기록 */}
        <Text style={styles.sectionTitle}>성장 기록</Text>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>📝</Text>
            <Text style={styles.statLabel}>작성한 일기</Text>
            <Text style={styles.statValue}>{profile.diaryCount}편</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statLabel}>현재 레벨</Text>
            <Text style={styles.statValue}>Lv.{profile.level}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statLabel}>다음 레벨까지</Text>
            <Text style={styles.statValue}>
              {profile.maxLevel ? '달성 완료!' : `${remaining}편`}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 이름 변경 모달 */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.nameModal}>
            <Text style={styles.modalTitle}>AI 친구 이름 변경</Text>
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
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
    fontSize: 22,
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
  profileEmoji: {
    fontSize: 64,
    marginBottom: 16,
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
    fontSize: 16,
  },
  levelBadge: {
    fontSize: 15,
    color: '#FF9B7A',
    fontWeight: '600',
    marginBottom: 16,
  },
  progressSection: {
    width: '100%',
    marginBottom: 16,
    gap: 8,
  },
  progressText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
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
  statIcon: {
    fontSize: 20,
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
