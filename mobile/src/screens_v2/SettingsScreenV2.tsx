/**
 * Settings v3 — Warm scrapbook settings space
 *
 * "앱 안에서 조용히 환경을 정리하는 개인 공간"
 * Ivory paper cards, serif section headers, sage accents,
 * warm tone throughout. Not a cold system menu.
 *
 * v3 design system tokens.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Modal, Image, Platform, Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';
import { changeLanguage, SupportedLanguage } from '../i18n/i18n';
import { useAuth, getStoredAuthProvider } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  colors, fontFamily, shadows, spacing, borderRadius, layout,
} from '../design-system-v3';
import { companionApi, ApiError } from '../api/client';
import { CompanionProfile, CompanionSettings, MainStackParamList } from '../types';
import { getAvatarImageUri } from '../utils/avatar';
import { ScreenContainer } from './components/ScreenContainer';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { DeleteAccountModalV2 } from './components/DeleteAccountModalV2';

const THEME_OPTIONS = [
  { value: 'warm' as const, labelKey: 'settings.themeWarm', bg: colors.bgWarm, border: colors.accentSand },
  { value: 'light' as const, labelKey: 'settings.themeLight', bg: colors.surfacePure, border: colors.accentSand + '60' },
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
  const [companion, setCompanion] = useState<CompanionProfile | null>(null);
  const [companionSettings, setCompanionSettings] = useState<CompanionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newAiName, setNewAiName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSocialUser, setIsSocialUser] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [companionData, companionSettingsData, authProvider] = await Promise.all([
        companionApi.getProfile(),
        companionApi.getSettings(),
        getStoredAuthProvider(),
      ]);
      setCompanion(companionData);
      setCompanionSettings(companionSettingsData);
      setIsSocialUser(authProvider !== null && authProvider !== 'EMAIL');
    } catch {} finally { setIsLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

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
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setIsUploadingAvatar(true);
    try {
      const updated = await companionApi.uploadAvatar(result.assets[0].uri);
      setCompanionSettings(updated);
    } catch (error) {
      Alert.alert(t('common.error'), error instanceof ApiError ? error.message : t('settings.photoUploadFailed'));
    } finally { setIsUploadingAvatar(false); }
  };

  const handleRemoveAvatar = () => {
    Alert.alert(t('settings.deletePhoto'), t('settings.deletePhotoConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        setIsUploadingAvatar(true);
        try {
          const updated = await companionApi.removeAvatar();
          setCompanionSettings(updated);
        } catch (error) {
          Alert.alert(t('common.error'), error instanceof ApiError ? error.message : t('settings.photoDeleteFailed'));
        } finally { setIsUploadingAvatar(false); }
      }},
    ]);
  };

  const handleOpenNameModal = () => {
    setNewAiName(companion?.aiName ?? '');
    setShowNameModal(true);
  };

  const handleSaveAiName = async () => {
    const trimmed = newAiName.trim();
    if (!trimmed) { Alert.alert(t('common.alert'), t('companion.nameRequired')); return; }
    setIsSavingName(true);
    try {
      const updated = await companionApi.updateName({ aiName: trimmed });
      setCompanion(updated);
      setShowNameModal(false);
    } catch (error) {
      Alert.alert(t('common.error'), error instanceof ApiError ? error.message : t('companion.nameChangeFailed'));
    } finally { setIsSavingName(false); }
  };

  const handleLogout = () => {
    Alert.alert(t('settings.logout'), t('settings.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.logout'), style: 'destructive', onPress: logout },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[s.loadingContainer, { backgroundColor: colors.bgCream }]}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
    );
  }

  const avatarUrl = getAvatarImageUri(companionSettings?.avatar);

  const headerContent = (
    <View style={s.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={s.backText}>{t('settings.back')}</Text>
      </TouchableOpacity>
      <Text style={s.headerTitle}>{t('settings.title')}</Text>
      <View style={{ width: 50 }} />
    </View>
  );

  return (
    <ScreenContainer header={headerContent}>
      {/* ── 프로필 ── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>{companion?.aiName ?? '친구'}</Text>
        <View style={s.profileCard}>
          <TouchableOpacity style={s.avatarWrap} onPress={handlePickAvatar} disabled={isUploadingAvatar}>
            {isUploadingAvatar ? (
              <ActivityIndicator size="small" color={colors.accentPrimary} />
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={s.avatarImage}
                onError={() => setCompanionSettings(prev => prev ? { ...prev, avatar: null } : prev)} />
            ) : (
              <Text style={s.avatarText}>{companion?.aiName?.charAt(0) ?? '?'}</Text>
            )}
          </TouchableOpacity>

          <View style={s.profileInfo}>
            <TouchableOpacity style={s.nameRow} onPress={handleOpenNameModal}>
              <Text style={s.profileName}>{companion?.aiName ?? '마음이'}</Text>
              <Text style={s.changeHint}>{t('companion.change')}</Text>
            </TouchableOpacity>
            <Text style={s.profileHint}>
              {avatarUrl ? t('settings.photoTapChange') : t('settings.photoTapSet')}
            </Text>
            {avatarUrl && (
              <TouchableOpacity onPress={handleRemoveAvatar} disabled={isUploadingAvatar}>
                <Text style={s.resetLink}>{t('settings.resetAvatar')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* ── 외관 ── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>{t('settings.appearance')}</Text>

        {/* 배경 테마 */}
        <View style={s.settingCard}>
          <Text style={s.settingTitle}>{t('settings.backgroundTheme')}</Text>
          <View style={s.themeRow}>
            {THEME_OPTIONS.map((opt) => {
              const isSelected = v1Theme.colors.background === opt.bg;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.themeCircle, {
                    backgroundColor: opt.bg,
                    borderColor: isSelected ? colors.accentPrimary : opt.border,
                    borderWidth: isSelected ? 2.5 : 1.5,
                  }]}
                  onPress={() => updateAppearance({ backgroundTheme: opt.value })}
                >
                  {isSelected && (
                    <View style={[s.themeCheck, {
                      backgroundColor: opt.value === 'dark' ? '#E8E8E8' : colors.accentPrimary,
                    }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 글자 크기 */}
        <View style={s.settingCard}>
          <Text style={s.settingTitle}>{t('settings.fontSize')}</Text>
          <View style={s.optionRow}>
            {FONT_SIZE_OPTIONS.map((opt) => {
              const currentSize = v1Theme.fontScale === 0.9 ? 'small' : v1Theme.fontScale === 1.15 ? 'large' : 'medium';
              const sel = currentSize === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.optionCard, sel ? s.optionSelected : s.optionDefault]}
                  onPress={() => updateAppearance({ fontSize: opt.value })}
                >
                  <Text style={[s.optionCaption, sel && { color: colors.accentPrimary }]}>
                    {t(opt.labelKey)}
                  </Text>
                  <Text style={[s.optionPreview, { fontSize: Math.round(16 * opt.scale), fontFamily: v1Theme.fontFamily }]}>
                    {t('settings.previewSample')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 글자 폰트 */}
        <View style={s.settingCard}>
          <Text style={s.settingTitle}>{t('settings.fontFamily')}</Text>
          <View style={s.optionRow}>
            {FONT_FAMILY_OPTIONS.map((opt) => {
              const sel = (v1Theme.fontFamily === undefined && opt.value === 'system')
                || (v1Theme.fontFamily === 'serif' && opt.value === 'serif');
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.optionCard, sel ? s.optionSelected : s.optionDefault]}
                  onPress={() => updateAppearance({ fontFamily: opt.value })}
                >
                  <Text style={[s.optionCaption, sel && { color: colors.accentPrimary }]}>
                    {t(opt.labelKey)}
                  </Text>
                  <Text style={[s.optionPreview, { fontFamily: opt.font }]}>
                    {t('settings.previewText')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 미리보기 */}
        <View style={s.previewCard}>
          <Text style={s.previewLabel}>{t('settings.preview')}</Text>
          <Text style={{
            fontSize: Math.round(16 * v1Theme.fontScale),
            fontFamily: v1Theme.fontFamily,
            color: colors.textPrimary,
            lineHeight: Math.round(26 * v1Theme.fontScale),
          }}>
            {t('settings.previewLong')}
          </Text>
        </View>
      </View>

      {/* ── 언어 ── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>{t('settings.language')}</Text>
        <View style={s.listCard}>
          {([
            { code: 'ko' as const, label: '한국어' },
            { code: 'en' as const, label: 'English' },
            { code: 'ja' as const, label: '日本語' },
            { code: 'zh' as const, label: '中文' },
          ]).map((lang, index) => (
            <TouchableOpacity
              key={lang.code}
              style={[s.listRow, index > 0 && s.listRowBorder]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Text style={s.listRowText}>{lang.label}</Text>
              {i18n.language === lang.code && (
                <Text style={s.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── 계정 ── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>{t('settings.account')}</Text>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>{t('settings.logout')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm }}
          onPress={() => setShowDeleteModal(true)}
        >
          <Text style={s.deleteText}>{t('settings.deleteAccount')}</Text>
        </TouchableOpacity>
      </View>

      {/* ── 앱 정보 ── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>{t('settings.appInfo')}</Text>
        <View style={s.listCard}>
          <TouchableOpacity style={s.listRow} onPress={() => Linking.openURL('https://mamuri.app/privacy')}>
            <Text style={s.listRowText}>{t('settings.privacyPolicy')}</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.listRow, s.listRowBorder]} onPress={() => Linking.openURL('https://mamuri.app/terms')}>
            <Text style={s.listRowText}>{t('settings.termsOfService')}</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.versionText}>{t('settings.appVersion')}</Text>
        <Text style={s.disclaimerText}>{t('settings.aiDisclaimer')}</Text>
      </View>

      {/* 이름 변경 모달 */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.nameModal}>
            <Text style={s.modalTitle}>{t('companion.changeName')}</Text>
            <Input
              value={newAiName}
              onChangeText={setNewAiName}
              placeholder={t('companion.newNamePlaceholder')}
              maxLength={20}
              autoFocus
              containerStyle={{ marginBottom: spacing.xl }}
            />
            <View style={s.modalBtns}>
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
        isSocialUser={isSocialUser}
      />
    </ScreenContainer>
  );
}

export default SettingsScreenV2;

const s = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing.lg,
  },
  backText: {
    fontFamily: fontFamily.sans, fontSize: 15, color: colors.accentPrimary,
  },
  headerTitle: {
    fontFamily: fontFamily.serifItalic, fontSize: 18, fontWeight: '400',
    color: colors.textPrimary,
  },

  // Section
  section: { marginBottom: spacing['3xl'] },
  sectionLabel: {
    fontFamily: fontFamily.serifItalic, fontSize: 14, fontWeight: '400',
    color: colors.textTertiary, letterSpacing: 0.5,
    marginBottom: spacing.lg,
  },

  // Profile card
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgIvory, borderRadius: borderRadius.sm,
    padding: spacing.lg, gap: spacing.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    ...shadows.crisp,
  },
  avatarWrap: {
    width: 68, height: 68,
    borderTopLeftRadius: 24, borderTopRightRadius: 30,
    borderBottomRightRadius: 26, borderBottomLeftRadius: 32,
    backgroundColor: colors.accentPrimaryLight + '40',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  avatarImage: { width: 68, height: 68, borderRadius: 34 },
  avatarText: {
    fontFamily: fontFamily.script, fontSize: 30, color: colors.accentPrimary,
  },
  profileInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileName: {
    fontFamily: fontFamily.serifItalic, fontSize: 18, fontWeight: '400',
    color: colors.textPrimary,
  },
  changeHint: {
    fontFamily: fontFamily.sans, fontSize: 11, color: colors.accentPrimary,
  },
  profileHint: {
    fontFamily: fontFamily.sans, fontSize: 12, color: colors.textSecondary,
  },
  resetLink: {
    fontFamily: fontFamily.sans, fontSize: 11, color: colors.accentPrimary,
    marginTop: 2,
  },

  // Setting card
  settingCard: {
    backgroundColor: colors.bgIvory, borderRadius: borderRadius.sm,
    padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  settingTitle: {
    fontFamily: fontFamily.sansMedium, fontSize: 14, fontWeight: '500',
    color: colors.textPrimary, marginBottom: spacing.md,
  },
  themeRow: { flexDirection: 'row', gap: spacing.md },
  themeCircle: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  themeCheck: { width: 10, height: 10, borderRadius: 5 },

  optionRow: { flexDirection: 'row', gap: spacing.sm },
  optionCard: {
    flex: 1, alignItems: 'center', padding: spacing.md,
    borderWidth: 1, borderRadius: borderRadius.sm, gap: 6,
  },
  optionDefault: {
    borderColor: colors.accentSand + '40', backgroundColor: colors.surfaceCard,
  },
  optionSelected: {
    borderColor: colors.accentPrimary, backgroundColor: colors.accentPrimaryLight + '15',
  },
  optionCaption: {
    fontFamily: fontFamily.sans, fontSize: 11, color: colors.textSecondary,
  },
  optionPreview: {
    fontSize: 15, color: colors.textPrimary,
  },

  previewCard: {
    backgroundColor: colors.bgIvory, borderRadius: borderRadius.sm,
    padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  previewLabel: {
    fontFamily: fontFamily.sans, fontSize: 11, color: colors.textTertiary,
    marginBottom: spacing.sm,
  },

  // List card
  listCard: {
    backgroundColor: colors.bgIvory, borderRadius: borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: spacing.md,
  },
  listRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: spacing.lg,
  },
  listRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.accentSand + '30',
  },
  listRowText: {
    fontFamily: fontFamily.sans, fontSize: 15, color: colors.textPrimary, flex: 1,
  },
  checkmark: { fontSize: 18, color: colors.accentPrimary },
  chevron: { fontSize: 20, color: colors.textTertiary },

  // Account
  logoutBtn: {
    backgroundColor: colors.bgIvory, borderRadius: borderRadius.sm,
    padding: spacing.lg, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  logoutText: {
    fontFamily: fontFamily.sansMedium, fontSize: 14, color: '#E05454',
  },
  deleteText: {
    fontFamily: fontFamily.sans, fontSize: 13, color: colors.textTertiary,
  },

  // App info
  versionText: {
    fontFamily: fontFamily.sans, fontSize: 12, color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  disclaimerText: {
    fontFamily: fontFamily.sans, fontSize: 12, color: colors.textTertiary,
    lineHeight: 20,
  },

  // Modal
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.overlayDim, padding: spacing['2xl'],
  },
  nameModal: {
    backgroundColor: colors.bgIvory, borderRadius: borderRadius.sm,
    padding: spacing['2xl'], width: '100%', maxWidth: 320,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    ...shadows.soft,
  },
  modalTitle: {
    fontFamily: fontFamily.serifItalic, fontSize: 20, fontWeight: '400',
    color: colors.textPrimary, textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modalBtns: { flexDirection: 'row', gap: spacing.md },
});
