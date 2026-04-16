/**
 * HomeStickerScreen V3 — Scrapbook emotional home
 *
 * "감정 기록을 시작하고 싶게 만드는 첫 화면"
 * Paper-textured background with editorial greeting,
 * emotion sticker grid, weekly strip, and recent diary cards.
 *
 * v3 design system: PaperBackground, tokens, scrapbook cards.
 * No react-native-svg dependency.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, RefreshControl, Dimensions, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import {
  colors, fontFamily, shadows, spacing, borderRadius,
} from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import { diaryApi, emotionApi, companionApi } from '../api/client';
import type { Diary, CompanionProfile, CompanionSettings, EmotionKey } from '../types';
import { EMOTION_COLORS, EMOTION_LABELS, EMOTION_KEYS } from '../constants/stickers';
import { EmotionStickerView } from './components/EmotionStickerView';
import { RelationshipProgressBar } from './components/RelationshipProgressBar';
import { getAvatarImageUri } from '../utils/avatar';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_W } = Dimensions.get('window');
const STICKER_SIZE = (SCREEN_W - 48 - 24) / 3;

// Blob shapes for sticker cards
const stickerBlobRadii = [
  { borderTopLeftRadius: 22, borderTopRightRadius: 28, borderBottomRightRadius: 24, borderBottomLeftRadius: 30 },
  { borderTopLeftRadius: 28, borderTopRightRadius: 22, borderBottomRightRadius: 30, borderBottomLeftRadius: 24 },
  { borderTopLeftRadius: 24, borderTopRightRadius: 30, borderBottomRightRadius: 22, borderBottomLeftRadius: 28 },
  { borderTopLeftRadius: 30, borderTopRightRadius: 24, borderBottomRightRadius: 28, borderBottomLeftRadius: 22 },
  { borderTopLeftRadius: 26, borderTopRightRadius: 26, borderBottomRightRadius: 30, borderBottomLeftRadius: 22 },
  { borderTopLeftRadius: 22, borderTopRightRadius: 30, borderBottomRightRadius: 26, borderBottomLeftRadius: 26 },
];

export default function HomeStickerScreenV3() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();

  // EmotionPicker에서 돌아온 감정
  const [todayEmotion, setTodayEmotion] = useState<EmotionKey | null>(null);
  const [todayTag, setTodayTag] = useState<string | null>(null);

  useEffect(() => {
    const emotion = route.params?.selectedEmotion as EmotionKey | undefined;
    const tag = route.params?.selectedTag as string | undefined;
    if (emotion) {
      setTodayEmotion(emotion);
      setTodayTag(tag || null);
    }
  }, [route.params?.selectedEmotion, route.params?.selectedTag]);

  const { companionName } = useAuth();
  const [profile, setProfile] = useState<CompanionProfile | null>(null);
  const [companionSettings, setCompanionSettings] = useState<CompanionSettings | null>(null);
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [weekly, setWeekly] = useState<any>(null);
  const [msg, setMsg] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const fade = useState(new Animated.Value(0))[0];

  const load = useCallback(async () => {
    const [p, cs, d, w, m] = await Promise.all([
      companionApi.getProfile().catch(() => null),
      companionApi.getSettings().catch(() => null),
      diaryApi.getList().catch(() => []),
      emotionApi.getWeeklySummary().catch(() => null),
      companionApi.getMessage().catch(() => null),
    ]);
    setProfile(p);
    setCompanionSettings(cs);
    setDiaries((d || []).slice(0, 5));
    setWeekly(w);
    setMsg(m);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const h = new Date().getHours();
  const greet = h < 6 ? t('home.greetingDawn') : h < 12 ? t('home.greetingMorning') : h < 18 ? t('home.greetingAfternoon') : t('home.greetingEvening');

  const handleStickerTap = (key: EmotionKey) => {
    nav.navigate('EmotionPicker', { preselectedEmotion: key });
  };

  const weekDays = t('home.weekDays', { returnObjects: true }) as string[];
  const weekStrip = getWeekStrip(weekly);

  return (
    <PaperBackground variant="plain" color="cream">
      <Animated.View style={[styles.root, { paddingTop: insets.top, opacity: fade }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh}
              tintColor={colors.accentPrimary} />
          }
        >
          {/* ═══ Companion Ambient Card — avatar, name, relationship, settings ═══ */}
          {profile && (() => {
            const displayName = companionName || profile.aiName || t('companion.defaultName');
            const avatarUri = getAvatarImageUri(companionSettings?.avatar);
            const relationshipStage = Math.min(7, Math.ceil(profile.level / 2));
            const openSettings = () => nav.getParent()?.navigate('Settings' as never);
            return (
              <TouchableOpacity
                style={styles.companionCard}
                onPress={openSettings}
                activeOpacity={0.85}
              >
                <View style={styles.companionTopRow}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.companionAvatarImg} />
                  ) : (
                    <View style={styles.greetingAvatar}>
                      <Text style={styles.greetingAvatarText}>{displayName[0]}</Text>
                    </View>
                  )}
                  <View style={styles.greetingBody}>
                    <Text style={styles.greetingName}>{displayName}</Text>
                    <Text style={styles.greetingMsg} numberOfLines={2}>
                      {msg?.type
                        ? t(`companionMsg.${msg.type}`, { days: msg.message?.match(/\d+/)?.[0] || '', defaultValue: msg.message })
                        : greet}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={openSettings}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.companionGearBtn}
                  >
                    <View style={styles.gearIcon}>
                      <View style={styles.gearCenter} />
                      {[0, 60, 120, 180, 240, 300].map((deg) => (
                        <View
                          key={deg}
                          style={[styles.gearTooth, { transform: [{ rotate: `${deg}deg` }, { translateY: -7 }] }]}
                        />
                      ))}
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={styles.companionProgressWrap}>
                  <RelationshipProgressBar
                    currentStage={relationshipStage}
                    currentLevel={profile.level}
                    maxLevel={profile.maxLevel ? profile.level : profile.level + 1}
                  />
                </View>
              </TouchableOpacity>
            );
          })()}

          {/* ═══ Hero Question — editorial feel ═══ */}
          <View style={styles.heroSection}>
            <Text style={styles.heroSub}>{greet}</Text>
            <Text style={styles.heroMain}>{t('home.howAreYou')}</Text>
          </View>

          {/* ═══ 오늘의 감정 배너 (선택 후) ═══ */}
          {todayEmotion && (
            <TouchableOpacity
              style={[styles.todayBanner, {
                backgroundColor: EMOTION_COLORS[todayEmotion] + '12',
                borderColor: EMOTION_COLORS[todayEmotion] + '30',
              }]}
              onPress={() => nav.navigate('EmotionPicker', { preselectedEmotion: todayEmotion })}
              activeOpacity={0.7}
            >
              <EmotionStickerView emotionKey={todayEmotion} size="small" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.todayLabel, { color: EMOTION_COLORS[todayEmotion] }]}>
                  {t('home.todayFeeling')}
                </Text>
                <Text style={[styles.todayEmotion, { color: EMOTION_COLORS[todayEmotion] }]}>
                  {todayTag || EMOTION_LABELS[todayEmotion]}
                </Text>
              </View>
              <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{t('home.change')}</Text>
            </TouchableOpacity>
          )}

          {/* ═══ Emotion Sticker Grid (2x3) — blob cards ═══ */}
          <View style={styles.stickerGrid}>
            {EMOTION_KEYS.map((key, index) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.stickerCard,
                  stickerBlobRadii[index % stickerBlobRadii.length],
                  { backgroundColor: EMOTION_COLORS[key] + '12' },
                ]}
                onPress={() => handleStickerTap(key)}
                activeOpacity={0.6}
              >
                <EmotionStickerView emotionKey={key} size="medium" />
                <Text style={[styles.stickerLabel, { color: EMOTION_COLORS[key] }]}>
                  {EMOTION_LABELS[key]}
                </Text>
              </TouchableOpacity>
            ))}
            {/* "모르겠어요" */}
            <TouchableOpacity
              style={[
                styles.stickerCard,
                stickerBlobRadii[5],
                { backgroundColor: colors.accentSand + '20' },
              ]}
              onPress={() => nav.navigate('EmotionPicker', {})}
              activeOpacity={0.6}
            >
              <View style={styles.questionMark}>
                <Text style={styles.questionText}>?</Text>
              </View>
              <Text style={[styles.stickerLabel, { color: colors.textTertiary }]}>{t('home.unknown')}</Text>
            </TouchableOpacity>
          </View>

          {/* ═══ Weekly Emotion Strip ═══ */}
          <View style={styles.weekSection}>
            <Text style={styles.sectionLabel}>{t('home.thisWeek')}</Text>
            <View style={styles.weekRow}>
              {weekStrip.map((entry, i) => (
                <View key={i} style={styles.weekCol}>
                  {entry.emotion ? (
                    <EmotionStickerView emotionKey={entry.emotion as EmotionKey} size="small" />
                  ) : (
                    <View style={styles.weekDotEmpty} />
                  )}
                  <Text style={styles.weekDay}>{weekDays[entry.dayOfWeek]}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ═══ CTA — scrapbook button ═══ */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => nav.navigate('DiaryList', { screen: 'WriteDiary' })}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaText}>{t('home.startRecord')}</Text>
          </TouchableOpacity>

          {/* ═══ Recent Entries — paper cards ═══ */}
          {diaries.length > 0 && (
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <Text style={styles.sectionLabel}>{t('home.recentRecords')}</Text>
                <TouchableOpacity
                  onPress={() => nav.navigate('DiaryList', { screen: 'DiaryListHome' })}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.linkText}>{t('home.viewAll')}</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
                {diaries.map((d) => {
                  const date = new Date(d.diaryDate);
                  return (
                    <TouchableOpacity
                      key={d.id}
                      style={styles.recentCard}
                      onPress={() => nav.navigate('DiaryList', {
                        screen: 'DiaryDetail', params: { diaryId: d.id },
                      })}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.recentDate}>
                        {t('date.monthDay', { month: date.getMonth() + 1, day: date.getDate() })}
                      </Text>
                      <Text style={styles.recentTitle} numberOfLines={1}>{d.title}</Text>
                      <Text style={styles.recentPreview} numberOfLines={2}>{d.content}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={{ height: 48 }} />
        </ScrollView>
      </Animated.View>
    </PaperBackground>
  );
}

function getWeekStrip(weekly: any): { emotion: string | null; dayOfWeek: number }[] {
  const today = new Date();
  const result: { emotion: string | null; dayOfWeek: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const entry = weekly?.calendar?.find((e: any) => e.date === dateStr);
    result.push({ emotion: entry?.emotion || null, dayOfWeek: d.getDay() });
  }
  return result;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing['2xl'], paddingBottom: 120 },

  // Companion ambient card — avatar, name, recent AI line, relationship bar, settings gear
  companionCard: {
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.sm,
    paddingVertical: 16, paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)',
    ...shadows.crisp,
  },
  companionTopRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  companionAvatarImg: {
    width: 40, height: 40,
    borderTopLeftRadius: 14, borderTopRightRadius: 18,
    borderBottomRightRadius: 16, borderBottomLeftRadius: 20,
    marginRight: spacing.lg,
    backgroundColor: colors.accentSand + '20',
  },
  companionGearBtn: {
    marginLeft: spacing.md,
    padding: 4,
  },
  companionProgressWrap: {
    marginTop: spacing.md,
  },
  gearIcon: {
    width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
  },
  gearCenter: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: colors.textTertiary,
  },
  gearTooth: {
    position: 'absolute',
    width: 3, height: 5, borderRadius: 1,
    backgroundColor: colors.textTertiary,
  },
  // Legacy greeting card (kept for style reference; not rendered after step 2)
  greetingCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.sm,
    paddingVertical: 18, paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)',
    ...shadows.crisp,
  },
  greetingAvatar: {
    width: 40, height: 40,
    borderTopLeftRadius: 14, borderTopRightRadius: 18,
    borderBottomRightRadius: 16, borderBottomLeftRadius: 20,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.lg,
  },
  greetingAvatarText: {
    fontFamily: fontFamily.script,
    fontSize: 20, color: colors.surfacePure,
  },
  greetingBody: { flex: 1 },
  greetingName: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 14, fontWeight: '600',
    color: colors.accentPrimary, marginBottom: 2,
  },
  greetingMsg: {
    fontFamily: fontFamily.sans,
    fontSize: 12, lineHeight: 18,
    color: colors.textSecondary,
  },

  // Hero — editorial serif
  heroSection: { alignItems: 'center', marginTop: spacing['5xl'], marginBottom: spacing['3xl'] },
  heroSub: {
    fontFamily: fontFamily.sans,
    fontSize: 14, fontWeight: '300',
    color: colors.textTertiary, letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  heroMain: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 26, fontWeight: '400',
    color: colors.textPrimary, letterSpacing: -0.5,
  },

  // Today emotion banner
  todayBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: borderRadius.sm, borderWidth: 1,
  },
  todayLabel: {
    fontFamily: fontFamily.sans, fontSize: 11, marginBottom: 2,
  },
  todayEmotion: {
    fontFamily: fontFamily.sansMedium, fontSize: 16, fontWeight: '600',
  },

  // Sticker Grid — blob cards
  stickerGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: spacing.md,
    marginBottom: spacing['4xl'],
  },
  stickerCard: {
    width: STICKER_SIZE, height: STICKER_SIZE,
    alignItems: 'center', justifyContent: 'center',
    gap: 6,
  },
  stickerLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 12, fontWeight: '600', letterSpacing: -0.2,
  },
  questionMark: {
    width: 48, height: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  questionText: {
    fontFamily: fontFamily.script,
    fontSize: 32, color: colors.textTertiary,
  },

  // Section label
  sectionLabel: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 14, fontWeight: '400',
    color: colors.textTertiary, letterSpacing: 0.5,
    textAlign: 'center',
  },

  // Week strip
  weekSection: { alignItems: 'center', marginBottom: spacing['4xl'] },
  weekRow: {
    flexDirection: 'row', gap: spacing['2xl'],
    marginTop: spacing.xl,
  },
  weekCol: { alignItems: 'center', gap: spacing.sm },
  weekDotEmpty: {
    width: 20, height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.accentSand + '60',
  },
  weekDay: {
    fontFamily: fontFamily.sans,
    fontSize: 10, color: colors.textTertiary,
  },

  // CTA — warm outline button
  ctaButton: {
    borderWidth: 1,
    borderColor: colors.accentPrimary,
    borderRadius: borderRadius['2xl'],
    height: 54, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing['4xl'],
    backgroundColor: 'rgba(253, 252, 248, 0.5)',
  },
  ctaText: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 16, color: colors.textPrimary,
  },

  // Recent — paper cards
  recentSection: { marginBottom: spacing['3xl'] },
  recentHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.lg,
  },
  linkText: {
    fontFamily: fontFamily.sans,
    fontSize: 12, color: colors.accentPrimary,
  },
  recentScroll: { gap: spacing.md },
  recentCard: {
    width: 160, backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.sm, padding: spacing.lg,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)',
    ...shadows.crisp,
  },
  recentDate: {
    fontFamily: fontFamily.script,
    fontSize: 14, color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  recentTitle: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 14, fontWeight: '600',
    color: colors.textPrimary, marginBottom: 4,
  },
  recentPreview: {
    fontFamily: fontFamily.sans,
    fontSize: 12, lineHeight: 18,
    color: colors.textSecondary,
  },
});
