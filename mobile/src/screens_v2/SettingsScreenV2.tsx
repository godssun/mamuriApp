/**
 * Design System v2 — Settings Screen
 *
 * Profile, appearance, subscription, account, app info.
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
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';
import { changeLanguage, SupportedLanguage } from '../i18n/i18n';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeV2 } from '../design-system-v2';
import { companionApi, ApiError } from '../api/client';
import { CompanionProfile, CompanionSettings, MainStackParamList } from '../types';
import { getAvatarImageUri } from '../utils/avatar';
import { ScreenContainer } from './components/ScreenContainer';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { DeleteAccountModalV2 } from './components/DeleteAccountModalV2';

const THEME_OPTIONS = [
  { value: 'warm' as const, labelKey: 'settings.themeWarm', bg: '#FFF9F5', border: '#F0F0F0' },
  { value: 'light' as const, labelKey: 'settings.themeLight', bg: '#FFFFFF', border: '#E5E5E5' },
  { value: 'dark' as const, labelKey: 'settings.themeDark', bg: '#1A1A2E', border: '#2A2A4E' },
];

const FONT_SIZE_OPTIONS = [
  { value: 'small' as const, labelKey: 'settings.fontSizeSmall', scale: 0.9 },
  { value: 'medium' as const, labelKey: 'settings.fontSizeMedium', scale: 1.0 },
  { value: 'large' as const, labelKey: 'settings.fontSizeLarge', scale: 1.15 },
];

const FONT_FAMILY_OPTIONS = [
  { value: 'system' as const, labelKey: 'settings.fontSystem', font: undefined as string | undefined },
  { value: 'serif' as const, labelKey: 'settings.fontSerif', font: 'NanumMyeongjo_400Regular' as string | undefined },
];

export function SettingsScreenV2() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { t } = useTranslation();
  const { logout, forceLogout } = useAuth();
  const { isPremium } = useSubscription();
  const { theme: v1Theme, updateAppearance } = useTheme();
  const { theme } = useThemeV2();
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

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    await changeLanguage(lang);
  };

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
    if (result.canceled || !result.assets?.[0]) return;
    setIsUploadingAvatar(true);
    try {
      const updated = await companionApi.uploadAvatar(result.assets[0].uri);
      setCompanionSettings(updated);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('settings.photoUploadFailed');
      Alert.alert(t('common.error'), message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    Alert.alert(
      t('settings.deletePhoto'),
      t('settings.deletePhotoConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setIsUploadingAvatar(true);
            try {
              const updated = await companionApi.removeAvatar();
              setCompanionSettings(updated);
            } catch (error) {
              const message = error instanceof ApiError ? error.message : t('settings.photoDeleteFailed');
              Alert.alert(t('common.error'), message);
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
      Alert.alert(t('common.alert'), t('companion.nameRequired'));
      return;
    }
    setIsSavingName(true);
    try {
      const updated = await companionApi.updateName({ aiName: trimmed });
      setCompanion(updated);
      setShowNameModal(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('companion.nameChangeFailed');
      Alert.alert(t('common.error'), message);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.logout'), style: 'destructive', onPress: logout },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const avatarUrl = getAvatarImageUri(companionSettings?.avatar);

  const headerContent = (
    <View style={[styles.header, { paddingHorizontal: theme.layout.screenPaddingH }]}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={[theme.typography.bodyMedium, { color: theme.colors.primary }]}>{t('settings.back')}</Text>
      </TouchableOpacity>
      <Text style={[theme.typography.titleMedium, { color: theme.colors.textPrimary }]}>{t('settings.title')}</Text>
      <View style={{ width: 50 }} />
    </View>
  );

  return (
    <ScreenContainer header={headerContent}>
      {/* 프로필 */}
      <View style={styles.section}>
        <Text style={[theme.typography.labelMedium, { color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: theme.spacing.lg }]}>
          {companion?.aiName ?? '친구'}
        </Text>

        <View style={[styles.profileCard, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg }]}>
          <TouchableOpacity
            style={[styles.profileAvatarWrap, { backgroundColor: theme.colors.primarySubtle }]}
            onPress={handlePickAvatar}
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.profileAvatarImage}
                onError={() => setCompanionSettings(prev => prev ? { ...prev, avatar: null } : prev)}
              />
            ) : (
              <Text style={{ fontSize: 28, fontWeight: '700', color: theme.colors.primary }}>
                {companion?.aiName?.charAt(0) ?? '?'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <TouchableOpacity style={styles.profileNameRow} onPress={handleOpenNameModal}>
              <Text style={[theme.typography.titleLarge, { color: theme.colors.textPrimary }]}>
                {companion?.aiName ?? '마음이'}
              </Text>
              <Text style={[theme.typography.labelSmall, { color: theme.colors.primary }]}>{t('companion.change')}</Text>
            </TouchableOpacity>
            <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}>
              {avatarUrl ? t('settings.photoTapChange') : t('settings.photoTapSet')}
            </Text>
            {avatarUrl && (
              <TouchableOpacity onPress={handleRemoveAvatar} disabled={isUploadingAvatar}>
                <Text style={[theme.typography.caption, { color: theme.colors.primary, marginTop: theme.spacing.xxs }]}>
                  {t('settings.resetAvatar')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* 외관 섹션 */}
      <View style={styles.section}>
        <Text style={[theme.typography.labelMedium, { color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: theme.spacing.lg }]}>
          {t('settings.appearance')}
        </Text>

        {/* 배경 테마 */}
        <View style={[styles.settingRow, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.md }]}>
          <View style={styles.settingRowLeft}>
            <Text style={[theme.typography.titleSmall, { color: theme.colors.textPrimary, marginBottom: theme.spacing.xs }]}>{t('settings.backgroundTheme')}</Text>
            <View style={[styles.themePreviewRow, { gap: theme.spacing.md, marginTop: theme.spacing.md }]}>
              {THEME_OPTIONS.map((opt) => {
                const isSelected = v1Theme.colors.background === opt.bg;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.themeCircle,
                      { backgroundColor: opt.bg, borderColor: isSelected ? theme.colors.primary : opt.border },
                      isSelected && { borderWidth: 2.5 },
                    ]}
                    onPress={() => updateAppearance({ backgroundTheme: opt.value })}
                  >
                    {isSelected && (
                      <View style={[styles.themeCheckDot, {
                        backgroundColor: opt.value === 'dark' ? '#E8E8E8' : theme.colors.primary,
                      }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 글자 크기 */}
        <View style={[styles.settingRow, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.md }]}>
          <View style={styles.settingRowLeft}>
            <Text style={[theme.typography.titleSmall, { color: theme.colors.textPrimary, marginBottom: theme.spacing.xs }]}>{t('settings.fontSize')}</Text>
            <View style={[styles.optionRow, { gap: theme.spacing.sm, marginTop: theme.spacing.md }]}>
              {FONT_SIZE_OPTIONS.map((opt) => {
                const currentSize = v1Theme.fontScale === 0.9 ? 'small' : v1Theme.fontScale === 1.15 ? 'large' : 'medium';
                const isSelected = currentSize === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.fontSizeCard,
                      {
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        backgroundColor: isSelected ? theme.colors.primarySubtle : theme.colors.surface,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}
                    onPress={() => updateAppearance({ fontSize: opt.value })}
                  >
                    <Text style={[theme.typography.caption, { color: isSelected ? theme.colors.primary : theme.colors.textSecondary }]}>
                      {t(opt.labelKey)}
                    </Text>
                    <Text style={{
                      fontSize: Math.round(16 * opt.scale),
                      color: theme.colors.textPrimary,
                      fontFamily: v1Theme.fontFamily,
                    }}>
                      {t('settings.previewSample')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 글자 폰트 */}
        <View style={[styles.settingRow, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.md }]}>
          <View style={styles.settingRowLeft}>
            <Text style={[theme.typography.titleSmall, { color: theme.colors.textPrimary, marginBottom: theme.spacing.xs }]}>{t('settings.fontFamily')}</Text>
            <View style={[styles.optionRow, { gap: theme.spacing.sm, marginTop: theme.spacing.md }]}>
              {FONT_FAMILY_OPTIONS.map((opt) => {
                const isSelected = (v1Theme.fontFamily === undefined && opt.value === 'system')
                  || (v1Theme.fontFamily === 'serif' && opt.value === 'serif');
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.fontFamilyCard,
                      {
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        backgroundColor: isSelected ? theme.colors.primarySubtle : theme.colors.surface,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}
                    onPress={() => updateAppearance({ fontFamily: opt.value })}
                  >
                    <Text style={[theme.typography.caption, { color: isSelected ? theme.colors.primary : theme.colors.textSecondary }]}>
                      {t(opt.labelKey)}
                    </Text>
                    <Text style={{
                      fontSize: 15,
                      fontFamily: opt.font,
                      color: theme.colors.textPrimary,
                    }}>
                      {t('settings.previewText')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 미리보기 */}
        <View style={[styles.previewCard, {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }]}>
          <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginBottom: theme.spacing.sm }]}>
            {t('settings.preview')}
          </Text>
          <Text style={{
            fontSize: Math.round(16 * v1Theme.fontScale),
            fontFamily: v1Theme.fontFamily,
            color: theme.colors.textPrimary,
            lineHeight: Math.round(26 * v1Theme.fontScale),
          }}>
            {t('settings.previewLong')}
          </Text>
        </View>
      </View>

      {/* 언어 */}
      <View style={styles.section}>
        <Text style={[theme.typography.labelMedium, { color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: theme.spacing.lg }]}>
          {t('settings.language')}
        </Text>
        <View style={[{ backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, overflow: 'hidden' }]}>
          {([
            { code: 'ko' as const, label: '한국어' },
            { code: 'en' as const, label: 'English' },
            { code: 'ja' as const, label: '日本語' },
            { code: 'zh' as const, label: '中文' },
          ]).map((lang, index) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.settingRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border }]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary, flex: 1 }]}>
                {lang.label}
              </Text>
              {i18n.language === lang.code && (
                <Text style={{ color: theme.colors.primary, fontSize: 18 }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 구독 섹션 */}
      <View style={styles.section}>
        <Text style={[theme.typography.labelMedium, { color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: theme.spacing.lg }]}>
          {t('settings.subscription')}
        </Text>
        <TouchableOpacity
          style={[styles.settingRow, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md }]}
          onPress={() => navigation.navigate('Subscription')}
        >
          <View style={styles.settingRowLeft}>
            <Text style={[theme.typography.titleSmall, { color: theme.colors.textPrimary }]}>{t('settings.subscriptionManage')}</Text>
            <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}>
              {isPremium ? t('settings.premiumActive') : t('settings.freePlan')}
            </Text>
          </View>
          <Text style={[{ fontSize: 20, color: theme.colors.textTertiary, marginLeft: theme.spacing.sm }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 계정 섹션 */}
      <View style={styles.section}>
        <Text style={[theme.typography.labelMedium, { color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: theme.spacing.lg }]}>
          {t('settings.account')}
        </Text>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md }]}
          onPress={handleLogout}
        >
          <Text style={[theme.typography.titleSmall, { color: theme.colors.error }]}>{t('settings.logout')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ paddingVertical: theme.spacing.md, alignItems: 'center', marginTop: theme.spacing.sm }}
          onPress={() => setShowDeleteModal(true)}
        >
          <Text style={[theme.typography.bodySmall, { color: theme.colors.textTertiary }]}>{t('settings.deleteAccount')}</Text>
        </TouchableOpacity>
      </View>

      {/* 앱 정보 */}
      <View style={styles.section}>
        <Text style={[theme.typography.labelMedium, { color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: theme.spacing.lg }]}>
          {t('settings.appInfo')}
        </Text>
        <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }]}>
          {t('settings.appVersion')}
        </Text>
        <Text style={[theme.typography.bodySmall, { color: theme.colors.textTertiary, lineHeight: 20 }]}>
          {t('settings.aiDisclaimer')}
        </Text>
      </View>

      {/* AI 이름 변경 모달 */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.nameModal, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl }]}>
            <Text style={[theme.typography.titleLarge, { color: theme.colors.textPrimary, textAlign: 'center', marginBottom: theme.spacing.xl }]}>
              {t('companion.changeName')}
            </Text>
            <Input
              value={newAiName}
              onChangeText={setNewAiName}
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
                <Button label={t('common.save')} variant="primary" onPress={handleSaveAiName} loading={isSavingName} fullWidth />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <DeleteAccountModalV2
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleted={forceLogout}
        isPremium={isPremium}
      />
    </ScreenContainer>
  );
}

export default SettingsScreenV2;

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
  section: {
    marginBottom: 32,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  profileAvatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingRowLeft: {
    flex: 1,
  },
  themePreviewRow: {
    flexDirection: 'row',
  },
  themeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeCheckDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionRow: {
    flexDirection: 'row',
  },
  fontSizeCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    gap: 6,
  },
  fontFamilyCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  previewCard: {
    padding: 16,
    marginBottom: 12,
  },
  logoutButton: {
    padding: 16,
    alignItems: 'center',
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
