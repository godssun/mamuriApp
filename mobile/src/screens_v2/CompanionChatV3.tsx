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
import { colors, fontFamily, shadows, spacing, borderRadius, layout } from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
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
        <ActivityIndicator size="large" color={colors.accentPrimary} />
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
    <PaperBackground variant="plain" color="cream">
      <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>{profile.aiName}</Text>
          <TouchableOpacity
            onPress={() => mainNav.navigate('Settings')}
            style={s.settingsBtn}
          >
            <View style={s.gearIcon}>
              <View style={s.gearCenter} />
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <View key={deg} style={[s.gearTooth, { transform: [{ rotate: `${deg}deg` }, { translateY: -7 }] }]} />
              ))}
            </View>
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

        {/* Memories Section — hidden from user (internal AI context only) */}

        {/* Stats */}
        <View style={s.statsCard}>
          <View style={s.statItem}>
            <Text style={s.statNum}>{profile.diaryCount}</Text>
            <Text style={s.statLabel}>함께한 기록</Text>
          </View>
          <View style={s.statDivider} />
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
                trackColor={{ false: colors.accentSand + '40', true: colors.accentPrimaryLight }}
                thumbColor={settings?.aiEnabled ? colors.accentPrimary : colors.textTertiary}
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
                        borderColor: isSelected ? colors.accentPrimary : colors.accentSand + '40',
                        backgroundColor: isSelected ? colors.accentPrimaryLight + '20' : colors.surfaceCard,
                      }]}
                      onPress={() => updateCompanionSettings({ aiTone: opt.value })}
                      disabled={isSavingCompanion}
                    >
                      <Text style={[s.optionLabel, { color: isSelected ? colors.accentPrimary : colors.textPrimary }]}>{opt.label}</Text>
                      <Text style={[s.optionDesc, { color: isSelected ? colors.accentPrimary : colors.textSecondary }]}>{opt.desc}</Text>
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
                        borderColor: isSelected ? colors.accentPrimary : colors.accentSand + '40',
                        backgroundColor: isSelected ? colors.accentPrimaryLight + '20' : colors.surfaceCard,
                      }]}
                      onPress={() => updateCompanionSettings({ speechStyle: opt.value })}
                      disabled={isSavingCompanion}
                    >
                      <Text style={[s.optionLabel, { color: isSelected ? colors.accentPrimary : colors.textPrimary }]}>{opt.label}</Text>
                      <Text style={[s.optionDesc, { color: isSelected ? colors.accentPrimary : colors.textSecondary }]}>{opt.desc}</Text>
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
    </PaperBackground>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: layout.screenPaddingH, paddingTop: 60, paddingBottom: 120 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgCream },
  errorText: { fontFamily: fontFamily.sans, fontSize: 13.5, color: colors.textSecondary, marginBottom: 16 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontFamily: fontFamily.serifItalic, fontSize: 26, lineHeight: 36,
    letterSpacing: -0.52, color: colors.textPrimary,
  },
  settingsBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bgIvory,
    alignItems: 'center', justifyContent: 'center',
  },
  gearIcon: {
    width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
  },
  gearCenter: {
    width: 8, height: 8, borderRadius: 4,
    borderWidth: 1.5, borderColor: colors.textSecondary,
  },
  gearTooth: {
    position: 'absolute',
    width: 3, height: 4, borderRadius: 1,
    backgroundColor: colors.textSecondary,
  },

  // Character Card
  characterCard: {
    backgroundColor: colors.bgIvory, borderRadius: borderRadius.sm,
    padding: 28, alignItems: 'center', marginBottom: spacing.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    ...shadows.soft,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 16 },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.accentPrimaryLight + '40',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  avatarText: { fontSize: 32, fontFamily: fontFamily.serifItalic, color: colors.accentPrimary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  charName: {
    fontFamily: fontFamily.serifItalic, fontSize: 22, lineHeight: 31,
    letterSpacing: -0.44, color: colors.textPrimary,
  },
  changeText: { fontFamily: fontFamily.sansMedium, fontSize: 11, color: colors.accentPrimary },

  progressSection: { width: '100%', marginTop: spacing.lg, marginBottom: spacing.md },

  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelBadge: {
    backgroundColor: colors.accentPrimaryLight + '30',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  levelBadgeText: { fontSize: 12, fontFamily: fontFamily.sansMedium, color: colors.accentPrimary },
  levelProgress: { fontFamily: fontFamily.sans, fontSize: 11, color: colors.textTertiary },

  // Message
  msgCard: {
    backgroundColor: colors.bgIvory, borderRadius: borderRadius.sm,
    padding: spacing.xl, marginBottom: spacing.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  msgText: {
    fontFamily: fontFamily.script, fontSize: 22, lineHeight: 28,
    color: colors.textPrimary, fontStyle: 'italic',
  },
  msgSub: { fontFamily: fontFamily.sans, fontSize: 11, color: colors.textTertiary, marginTop: 8 },

  // Stats
  statsCard: {
    flexDirection: 'row', backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.sm, padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    ...shadows.crisp,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: {
    fontSize: 28, fontFamily: fontFamily.serifItalic,
    color: colors.accentPrimary, letterSpacing: -1,
  },
  statLabel: { fontFamily: fontFamily.sans, fontSize: 11, color: colors.textTertiary, marginTop: 4 },
  statDivider: { width: 1, marginHorizontal: spacing.lg, backgroundColor: colors.accentSand + '30' },

  // Accordion
  accordionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md,
  },
  accordionTitle: {
    fontFamily: fontFamily.serifItalic, fontSize: 18, lineHeight: 25,
    color: colors.textPrimary,
  },
  accordionArrow: { fontSize: 16, color: colors.textTertiary },

  settingsBody: { gap: spacing.md },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
    backgroundColor: colors.bgIvory, borderRadius: borderRadius.md,
  },
  settingLabel: { fontFamily: fontFamily.sansMedium, fontSize: 16, color: colors.textPrimary, marginBottom: 2 },
  settingDesc: { fontFamily: fontFamily.sans, fontSize: 12, color: colors.textSecondary },
  settingGroup: { backgroundColor: colors.bgIvory, borderRadius: borderRadius.md, padding: 16 },
  optionList: { gap: 8, marginTop: 8 },
  optionItem: { padding: 14, borderWidth: 1, borderRadius: borderRadius.sm },
  optionLabel: { fontFamily: fontFamily.sansMedium, fontSize: 16 },
  optionDesc: { fontFamily: fontFamily.sans, fontSize: 12 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.overlayDim, padding: 24 },
  nameModal: { backgroundColor: colors.bgIvory, borderRadius: borderRadius.sm, padding: 24, width: '100%', maxWidth: 320 },
  modalTitle: {
    fontFamily: fontFamily.serifItalic, fontSize: 18, lineHeight: 25,
    color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xl,
  },
  modalBtns: { flexDirection: 'row', gap: 12 },
});
