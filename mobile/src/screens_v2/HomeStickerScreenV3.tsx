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
  Animated, RefreshControl, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  colors, fontFamily, shadows, spacing, borderRadius,
} from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import { diaryApi, emotionApi, companionApi } from '../api/client';
import type { Diary, CompanionProfile, EmotionKey } from '../types';
import { EMOTION_COLORS, EMOTION_LABELS, EMOTION_KEYS } from '../constants/stickers';
import { EmotionStickerView } from './components/EmotionStickerView';

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

  const [profile, setProfile] = useState<CompanionProfile | null>(null);
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [weekly, setWeekly] = useState<any>(null);
  const [msg, setMsg] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const fade = useState(new Animated.Value(0))[0];

  const load = useCallback(async () => {
    const [p, d, w, m] = await Promise.all([
      companionApi.getProfile().catch(() => null),
      diaryApi.getList().catch(() => []),
      emotionApi.getWeeklySummary().catch(() => null),
      companionApi.getMessage().catch(() => null),
    ]);
    setProfile(p);
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
  const greet = h < 6 ? '고요한 밤이에요' : h < 12 ? '좋은 아침이에요' : h < 18 ? '좋은 오후예요' : '좋은 저녁이에요';

  const handleStickerTap = (key: EmotionKey) => {
    nav.navigate('EmotionPicker', { preselectedEmotion: key });
  };

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
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
          {/* ═══ Companion Greeting — paper note card ═══ */}
          {profile && (
            <TouchableOpacity
              style={styles.greetingCard}
              onPress={() => nav.navigate('Companion')}
              activeOpacity={0.7}
            >
              <View style={styles.greetingAvatar}>
                <Text style={styles.greetingAvatarText}>{(profile.aiName || '마')[0]}</Text>
              </View>
              <View style={styles.greetingBody}>
                <Text style={styles.greetingName}>{profile.aiName || '마음이'}</Text>
                <Text style={styles.greetingMsg} numberOfLines={2}>
                  {msg?.message || greet}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* ═══ Hero Question — editorial feel ═══ */}
          <View style={styles.heroSection}>
            <Text style={styles.heroSub}>{greet}</Text>
            <Text style={styles.heroMain}>오늘 기분은 어때요?</Text>
          </View>

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
              <Text style={[styles.stickerLabel, { color: colors.textTertiary }]}>모르겠어요</Text>
            </TouchableOpacity>
          </View>

          {/* ═══ Weekly Emotion Strip ═══ */}
          <View style={styles.weekSection}>
            <Text style={styles.sectionLabel}>이번 주</Text>
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
            <Text style={styles.ctaText}>오늘 기록 시작하기</Text>
          </TouchableOpacity>

          {/* ═══ Recent Entries — paper cards ═══ */}
          {diaries.length > 0 && (
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <Text style={styles.sectionLabel}>최근 기록</Text>
                <TouchableOpacity
                  onPress={() => nav.navigate('DiaryList', { screen: 'DiaryListHome' })}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.linkText}>전체보기</Text>
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
                        {date.getMonth() + 1}/{date.getDate()}
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

  // Greeting Card — paper note feel
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
