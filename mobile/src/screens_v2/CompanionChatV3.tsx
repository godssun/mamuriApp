/**
 * CompanionChat V3 — Enhanced AI companion screen
 *
 * - Character area (name, level, relationship stage bar)
 * - Recent companion message (memory-based)
 * - "Things I remember" pills
 * - AI settings accordion
 * - Level progress bar
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Modal, Switch, LayoutAnimation,
  Platform, UIManager, Image, ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeV2 } from '../design-system-v2';
import type { Theme } from '../design-system-v2';
import { companionApi, settingsApi, memoryApi, ApiError } from '../api/client';
import type { CompanionProfile, CompanionSettings, UserSettings, MainStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getAvatarImageUri } from '../utils/avatar';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { RelationshipProgressBar } from './components/RelationshipProgressBar';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const AI_TONE_OPTIONS = [
  { value: 'warm' as const, label: '따뜻한', desc: '편안하고 다정한 말투' },
  { value: 'calm' as const, label: '차분한', desc: '조용하고 안정적인 말투' },
  { value: 'cheerful' as const, label: '밝은', desc: '에너지 넘치는 활기찬 말투' },
  { value: 'realistic' as const, label: '현실적인', desc: '솔직하고 담담한 말투' },
];

const SPEECH_STYLE_OPTIONS = [
  { value: 'formal' as const, label: '존댓말', desc: '정중한 존댓말' },
  { value: 'casual' as const, label: '반말', desc: '편안한 반말' },
];

export default function CompanionChatV3() {
  const mainNav = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { setCompanionName } = useAuth();
  const { theme } = useThemeV2();
  const s = makeStyles(theme);

  const [profile, setProfile] = useState<CompanionProfile | null>(null);
  const [companionSettings, setCompanionSettings] = useState<CompanionSettings | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [msg, setMsg] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [isSavingCompanion, setIsSavingCompanion] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [p, cs, us, mem, m, st] = await Promise.all([
        companionApi.getProfile(),
        companionApi.getSettings(),
        settingsApi.get(),
        memoryApi.getAll().catch(() => []),
        companionApi.getMessage().catch(() => null),
        companionApi.getStatus().catch(() => null),
      ]);
      setProfile(p);
      setCompanionName(p.aiName);
      setCompanionSettings(cs);
      setSettings(us);
      setMemories(mem || []);
      setMsg(m);
      setStatus(st);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleSaveName = async () => {
    const trimmed = newName.trim();
    if (!trimmed) { Alert.alert('알림', '이름을 입력해주세요.'); return; }
    setIsSavingName(true);
    try {
      const updated = await companionApi.updateName({ aiName: trimmed });
      setProfile(updated);
      setCompanionName(trimmed);
      setShowNameModal(false);
    } catch (error) {
      Alert.alert('오류', error instanceof ApiError ? error.message : '이름 변경에 실패했습니다.');
    } finally {
      setIsSavingName(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!settings) return;
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    try { await settingsApi.update(newSettings); } catch { setSettings(settings); }
  };

  const updateCompanionSettings = async (updates: Partial<CompanionSettings>) => {
    if (!companionSettings) return;
    const newCS = { ...companionSettings, ...updates };
    setCompanionSettings(newCS);
    setIsSavingCompanion(true);
    try {
      const result = await companionApi.updateSettings({ speechStyle: newCS.speechStyle, aiTone: newCS.aiTone });
      setCompanionSettings(result);
    } catch { setCompanionSettings(companionSettings); }
    finally { setIsSavingCompanion(false); }
  };

  const toggleAiSettings = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAiSettings(!showAiSettings);
  };

  if (isLoading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={s.loadingContainer}>
        <Text style={s.errorText}>프로필을 불러올 수 없습니다.</Text>
        <Button label="다시 시도" variant="primary" onPress={loadData} />
      </View>
    );
  }

  const relationshipStage = Math.min(7, Math.ceil(profile.level / 2));

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>{profile.aiName}</Text>
        <TouchableOpacity
          onPress={() => mainNav.navigate('Settings')}
          style={s.settingsBtn}
        >
          <View style={s.settingsIcon} />
        </TouchableOpacity>
      </View>

      {/* Character Card */}
      <View style={s.characterCard}>
        {getAvatarImageUri(companionSettings?.avatar) ? (
          <Image source={{ uri: getAvatarImageUri(companionSettings?.avatar)! }} style={s.avatar} />
        ) : (
          <View style={s.avatarPlaceholder}>
            <Text style={s.avatarText}>{profile.aiName.charAt(0)}</Text>
          </View>
        )}

        <TouchableOpacity style={s.nameRow} onPress={() => { setNewName(profile.aiName); setShowNameModal(true); }}>
          <Text style={s.charName}>{profile.aiName}</Text>
          <Text style={s.changeText}>변경</Text>
        </TouchableOpacity>

        {/* Relationship Progress */}
        <View style={s.progressSection}>
          <RelationshipProgressBar
            currentStage={relationshipStage}
            currentLevel={profile.level}
            maxLevel={profile.maxLevel ? profile.level : profile.level + 1}
          />
        </View>

        {/* Level info */}
        <View style={s.levelRow}>
          <View style={s.levelBadge}>
            <Text style={s.levelBadgeText}>Lv.{profile.level}</Text>
          </View>
          {!profile.maxLevel && (
            <Text style={s.levelProgress}>
              다음 레벨까지 {profile.nextLevelDiaryCount - profile.diaryCount}일기
            </Text>
          )}
        </View>
      </View>

      {/* Companion Message */}
      {msg && (
        <View style={s.msgCard}>
          <Text style={s.msgText}>"{msg.message}"</Text>
          {msg.subMessage && <Text style={s.msgSub}>{msg.subMessage}</Text>}
        </View>
      )}

      {/* Memories Section */}
      {memories.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>기억하고 있는 것들</Text>
          <View style={s.memoryPills}>
            {memories.slice(0, 6).map((mem: any) => (
              <View key={mem.id} style={s.memoryPill}>
                <Text style={s.memoryPillText} numberOfLines={1}>{mem.content || mem.summary}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={s.statsCard}>
        <View style={s.statItem}>
          <Text style={s.statNum}>{profile.diaryCount}</Text>
          <Text style={s.statLabel}>함께한 기록</Text>
        </View>
        <View style={[s.statDivider, { backgroundColor: theme.colors.border }]} />
        <View style={s.statItem}>
          <Text style={s.statNum}>{relationshipStage}</Text>
          <Text style={s.statLabel}>관계 단계</Text>
        </View>
      </View>

      {/* AI Settings Accordion */}
      <TouchableOpacity style={s.accordionHeader} onPress={toggleAiSettings} activeOpacity={0.7}>
        <Text style={s.accordionTitle}>AI 설정</Text>
        <Text style={s.accordionArrow}>{showAiSettings ? '⌃' : '⌄'}</Text>
      </TouchableOpacity>

      {showAiSettings && (
        <View style={s.settingsBody}>
          {/* AI Toggle */}
          <View style={s.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.settingLabel}>AI 코멘트</Text>
              <Text style={s.settingDesc}>일기에 AI 코멘트를 받을지 설정</Text>
            </View>
            <Switch
              value={settings?.aiEnabled ?? true}
              onValueChange={(v) => updateSettings({ aiEnabled: v })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
              thumbColor={settings?.aiEnabled ? theme.colors.primary : theme.colors.surfaceTertiary}
            />
          </View>

          {/* Tone */}
          <View style={s.settingGroup}>
            <Text style={s.settingLabel}>말투 톤</Text>
            <View style={s.optionList}>
              {AI_TONE_OPTIONS.map((opt) => {
                const isSelected = companionSettings?.aiTone === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.optionItem, {
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      backgroundColor: isSelected ? theme.colors.primarySubtle : theme.colors.surface,
                    }]}
                    onPress={() => updateCompanionSettings({ aiTone: opt.value })}
                    disabled={isSavingCompanion}
                  >
                    <Text style={[s.optionLabel, { color: isSelected ? theme.colors.primary : theme.colors.textPrimary }]}>{opt.label}</Text>
                    <Text style={[s.optionDesc, { color: isSelected ? theme.colors.primary : theme.colors.textSecondary }]}>{opt.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Speech style */}
          <View style={s.settingGroup}>
            <Text style={s.settingLabel}>말투 스타일</Text>
            <View style={s.optionList}>
              {SPEECH_STYLE_OPTIONS.map((opt) => {
                const isSelected = companionSettings?.speechStyle === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.optionItem, {
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      backgroundColor: isSelected ? theme.colors.primarySubtle : theme.colors.surface,
                    }]}
                    onPress={() => updateCompanionSettings({ speechStyle: opt.value })}
                    disabled={isSavingCompanion}
                  >
                    <Text style={[s.optionLabel, { color: isSelected ? theme.colors.primary : theme.colors.textPrimary }]}>{opt.label}</Text>
                    <Text style={[s.optionDesc, { color: isSelected ? theme.colors.primary : theme.colors.textSecondary }]}>{opt.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}

      <View style={{ height: 48 }} />

      {/* Name Change Modal */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.nameModal}>
            <Text style={s.modalTitle}>이름 변경</Text>
            <Input
              value={newName}
              onChangeText={setNewName}
              placeholder="새 이름 입력"
              maxLength={20}
              autoFocus
              containerStyle={{ marginBottom: 20 }}
            />
            <View style={s.modalBtns}>
              <View style={{ flex: 1 }}>
                <Button label="취소" variant="secondary" onPress={() => setShowNameModal(false)} fullWidth />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="저장" variant="primary" onPress={handleSaveName} loading={isSavingName} fullWidth />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    scroll: { paddingHorizontal: t.layout.screenPaddingH, paddingTop: 60, paddingBottom: 120 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.colors.background },
    errorText: { ...t.typography.bodyMedium, color: t.colors.textSecondary, marginBottom: 16 },

    // Header
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: t.spacing.xl,
    },
    headerTitle: { ...t.typography.headlineLarge, color: t.colors.textPrimary },
    settingsBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: t.colors.surfaceSecondary,
      alignItems: 'center', justifyContent: 'center',
    },
    settingsIcon: {
      width: 16, height: 16, borderRadius: 8,
      borderWidth: 1.5, borderColor: t.colors.textSecondary,
    },

    // Character Card
    characterCard: {
      backgroundColor: t.colors.surface, borderRadius: t.borderRadius.xl,
      padding: 28, alignItems: 'center', marginBottom: t.spacing.xl,
      ...t.shadows.md,
    },
    avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 16 },
    avatarPlaceholder: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: t.colors.primarySubtle,
      justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    },
    avatarText: { fontSize: 32, fontWeight: '700', color: t.colors.primary },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    charName: { ...t.typography.headlineMedium, color: t.colors.textPrimary },
    changeText: { ...t.typography.labelSmall, color: t.colors.primary },

    progressSection: { width: '100%', marginTop: t.spacing.lg, marginBottom: t.spacing.md },

    levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    levelBadge: {
      backgroundColor: t.colors.primarySubtle,
      paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: t.borderRadius.full,
    },
    levelBadgeText: { fontSize: 12, fontWeight: '700', color: t.colors.primary },
    levelProgress: { ...t.typography.caption, color: t.colors.textTertiary },

    // Message
    msgCard: {
      backgroundColor: t.colors.primarySubtle, borderRadius: t.borderRadius.xl,
      padding: t.spacing.xl, marginBottom: t.spacing.xl,
    },
    msgText: { ...t.typography.bodyMedium, color: t.colors.textPrimary, fontStyle: 'italic', lineHeight: 22 },
    msgSub: { ...t.typography.caption, color: t.colors.textTertiary, marginTop: 8 },

    // Memories
    section: { marginBottom: t.spacing.xl },
    sectionTitle: { ...t.typography.titleSmall, fontWeight: '600', color: t.colors.textPrimary, marginBottom: t.spacing.md },
    memoryPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    memoryPill: {
      backgroundColor: t.colors.surfaceSecondary,
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: t.borderRadius.full, maxWidth: '48%',
    },
    memoryPillText: { ...t.typography.bodySmall, color: t.colors.textSecondary },

    // Stats
    statsCard: {
      flexDirection: 'row', backgroundColor: t.colors.surface,
      borderRadius: t.borderRadius.lg, padding: t.spacing.xl,
      marginBottom: t.spacing.xl, ...t.shadows.sm,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 28, fontWeight: '200', color: t.colors.primary, letterSpacing: -1 },
    statLabel: { ...t.typography.caption, color: t.colors.textTertiary, marginTop: 4 },
    statDivider: { width: 1, marginHorizontal: t.spacing.lg },

    // Accordion
    accordionHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: t.spacing.md,
    },
    accordionTitle: { ...t.typography.titleLarge, color: t.colors.textPrimary },
    accordionArrow: { fontSize: 16, color: t.colors.textTertiary },

    settingsBody: { gap: t.spacing.md },
    settingRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', padding: 16,
      backgroundColor: t.colors.surface, borderRadius: t.borderRadius.md,
    },
    settingLabel: { ...t.typography.titleSmall, color: t.colors.textPrimary, marginBottom: 2 },
    settingDesc: { ...t.typography.bodySmall, color: t.colors.textSecondary },
    settingGroup: { backgroundColor: t.colors.surface, borderRadius: t.borderRadius.md, padding: 16 },
    optionList: { gap: 8, marginTop: 8 },
    optionItem: { padding: 14, borderWidth: 1, borderRadius: t.borderRadius.sm },
    optionLabel: { ...t.typography.titleSmall },
    optionDesc: { ...t.typography.bodySmall },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.colors.overlay, padding: 24 },
    nameModal: { backgroundColor: t.colors.surface, borderRadius: t.borderRadius.xl, padding: 24, width: '100%', maxWidth: 320 },
    modalTitle: { ...t.typography.titleLarge, fontWeight: '700', color: t.colors.textPrimary, textAlign: 'center', marginBottom: t.spacing.xl },
    modalBtns: { flexDirection: 'row', gap: 12 },
  });
}
