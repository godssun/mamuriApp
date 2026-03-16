/**
 * Design System v2 — Companion Screen (Tab)
 *
 * Profile card, diary stats, AI settings (tone, speech style, toggle).
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Switch,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { companionApi, settingsApi, ApiError } from '../api/client';
import { CompanionProfile, CompanionSettings, UserSettings, MainStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useThemeV2 } from '../design-system-v2';
import { getAvatarImageUri } from '../utils/avatar';
import { ScreenContainer } from './components/ScreenContainer';
import { Button } from './components/Button';
import { Input } from './components/Input';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

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

export function CompanionScreenV2() {
  const mainNavigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { t } = useTranslation();
  const { setCompanionName } = useAuth();
  const { theme } = useThemeV2();
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
      Alert.alert(t('common.alert'), t('companion.nameRequired'));
      return;
    }
    setIsSavingName(true);
    try {
      const updated = await companionApi.updateName({ aiName: trimmed });
      setProfile(updated);
      setCompanionName(trimmed);
      setShowNameModal(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('companion.nameChangeFailed');
      Alert.alert(t('common.error'), message);
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
      const message = error instanceof ApiError ? error.message : t('companion.settingSaveFailed');
      Alert.alert(t('common.error'), message);
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
      const message = error instanceof ApiError ? error.message : t('companion.settingSaveFailed');
      Alert.alert(t('common.error'), message);
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[theme.typography.bodyMedium, { color: theme.colors.textSecondary, marginBottom: theme.spacing.lg }]}>
          {t('companion.profileLoadFailed')}
        </Text>
        <Button label={t('companion.retry')} variant="primary" onPress={loadProfile} />
      </View>
    );
  }

  const headerContent = (
    <View style={[styles.header, { paddingHorizontal: theme.layout.screenPaddingH }]}>
      <Text style={[theme.typography.headlineLarge, { color: theme.colors.textPrimary }]}>
        {profile.aiName}
      </Text>
      <TouchableOpacity
        onPress={() => mainNavigation.navigate('Settings')}
        style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: theme.colors.surfaceSecondary }}
      >
        <Text style={{ fontSize: 16, color: theme.colors.textSecondary }}>⚙</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer header={headerContent}>
      {/* 프로필 카드 */}
      <View style={[styles.profileCard, {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        ...theme.shadows.md,
      }]}>
        {getAvatarImageUri(companionSettings?.avatar) ? (
          <Image
            source={{ uri: getAvatarImageUri(companionSettings?.avatar)! }}
            style={styles.profileImage}
            onError={() => setCompanionSettings(prev => prev ? { ...prev, avatar: null } : prev)}
          />
        ) : (
          <View style={[styles.profilePlaceholder, { backgroundColor: theme.colors.primarySubtle }]}>
            <Text style={[{ fontSize: 32, fontWeight: '700', color: theme.colors.primary }]}>
              {profile.aiName.charAt(0)}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.nameRow} onPress={handleOpenNameModal}>
          <Text style={[theme.typography.headlineMedium, { color: theme.colors.textPrimary }]}>
            {profile.aiName}
          </Text>
          <Text style={[theme.typography.labelSmall, { color: theme.colors.primary }]}>{t('companion.change')}</Text>
        </TouchableOpacity>

        <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
          {t('companion.profileDesc')}
        </Text>
      </View>

      {/* 기록 */}
      <Text style={[theme.typography.titleLarge, { color: theme.colors.textPrimary, marginTop: theme.spacing['2xl'], marginBottom: theme.spacing.md }]}>
        {t('companion.records')}
      </Text>
      <TouchableOpacity
        style={[styles.statsCard, {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          ...theme.shadows.sm,
        }]}
        onPress={() => mainNavigation.navigate('DiaryArchive')}
        activeOpacity={0.7}
      >
        <View style={styles.statRow}>
          <View style={[styles.statDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary, flex: 1 }]}>
            {t('companion.diaryCount')}
          </Text>
          <Text style={[theme.typography.titleSmall, { color: theme.colors.primary }]}>
            {t('companion.diaryCountValue', { count: profile.diaryCount })}
          </Text>
          <Text style={[theme.typography.bodySmall, { color: theme.colors.textTertiary, marginLeft: theme.spacing.xs }]}>
            →
          </Text>
        </View>
      </TouchableOpacity>

      {/* AI 설정 */}
      <TouchableOpacity
        style={[styles.settingSectionHeader, { marginTop: theme.spacing['2xl'] }]}
        onPress={toggleAiSettings}
        activeOpacity={0.7}
      >
        <Text style={[theme.typography.titleLarge, { color: theme.colors.textPrimary }]}>
          {t('companion.aiSettings')}
        </Text>
        <Text style={[theme.typography.bodyMedium, { color: theme.colors.textTertiary, fontSize: 16 }]}>
          {showAiSettings ? '⌃' : '⌄'}
        </Text>
      </TouchableOpacity>

      {showAiSettings && (
        <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.md }}>
          {/* AI 코멘트 토글 */}
          <View style={[styles.settingRow, {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
          }]}>
            <View style={{ flex: 1 }}>
              <Text style={[theme.typography.titleSmall, { color: theme.colors.textPrimary, marginBottom: theme.spacing.xxs }]}>
                {t('companion.aiCommentToggle')}
              </Text>
              <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}>
                {t('companion.aiCommentDesc')}
              </Text>
            </View>
            <Switch
              value={settings?.aiEnabled ?? true}
              onValueChange={(value) => updateSettings({ aiEnabled: value })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
              thumbColor={settings?.aiEnabled ? theme.colors.primary : theme.colors.surfaceTertiary}
            />
          </View>

          {/* AI 톤 */}
          <View style={[styles.settingGroup, {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
          }]}>
            <Text style={[theme.typography.titleSmall, { color: theme.colors.textPrimary, marginBottom: theme.spacing.md }]}>
              {t('companion.aiTone')}
            </Text>
            <View style={{ gap: theme.spacing.sm }}>
              {AI_TONE_OPTIONS.map((option) => {
                const isSelected = companionSettings?.aiTone === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.toneOption, {
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      backgroundColor: isSelected ? theme.colors.primarySubtle : theme.colors.surface,
                      borderRadius: theme.borderRadius.sm,
                    }]}
                    onPress={() => updateCompanionSettings({ aiTone: option.value })}
                    disabled={isSavingCompanion}
                  >
                    <Text style={[theme.typography.titleSmall, { color: isSelected ? theme.colors.primary : theme.colors.textPrimary }]}>
                      {t(option.labelKey)}
                    </Text>
                    <Text style={[theme.typography.bodySmall, { color: isSelected ? theme.colors.primary : theme.colors.textSecondary }]}>
                      {t(option.descKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 말투 스타일 */}
          <View style={[styles.settingGroup, {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
          }]}>
            <Text style={[theme.typography.titleSmall, { color: theme.colors.textPrimary, marginBottom: theme.spacing.md }]}>
              {t('companion.speechStyle')}
            </Text>
            <View style={{ gap: theme.spacing.sm }}>
              {SPEECH_STYLE_OPTIONS.map((option) => {
                const isSelected = companionSettings?.speechStyle === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.toneOption, {
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      backgroundColor: isSelected ? theme.colors.primarySubtle : theme.colors.surface,
                      borderRadius: theme.borderRadius.sm,
                    }]}
                    onPress={() => updateCompanionSettings({ speechStyle: option.value })}
                    disabled={isSavingCompanion}
                  >
                    <Text style={[theme.typography.titleSmall, { color: isSelected ? theme.colors.primary : theme.colors.textPrimary }]}>
                      {t(option.labelKey)}
                    </Text>
                    <Text style={[theme.typography.bodySmall, { color: isSelected ? theme.colors.primary : theme.colors.textSecondary }]}>
                      {t(option.descKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* 이름 변경 모달 */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.nameModal, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl }]}>
            <Text style={[theme.typography.titleLarge, { color: theme.colors.textPrimary, textAlign: 'center', marginBottom: theme.spacing.xl }]}>
              {t('companion.changeName')}
            </Text>
            <Input
              value={newName}
              onChangeText={setNewName}
              placeholder={t('companion.newNamePlaceholder')}
              maxLength={20}
              autoFocus
              containerStyle={{ marginBottom: theme.spacing.xl }}
            />
            <View style={styles.modalButtons}>
              <View style={{ flex: 1 }}>
                <Button label={t('common.cancel')} variant="secondary" onPress={() => setShowNameModal(false)} fullWidth />
              </View>
              <View style={{ flex: 1 }}>
                <Button label={t('common.save')} variant="primary" onPress={handleSaveName} loading={isSavingName} fullWidth />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

export default CompanionScreenV2;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  profileCard: {
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  statsCard: {
    padding: 20,
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
    marginRight: 12,
  },
  settingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingGroup: {
    padding: 16,
  },
  toneOption: {
    padding: 14,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  nameModal: {
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
});
