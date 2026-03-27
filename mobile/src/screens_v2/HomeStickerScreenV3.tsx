/**
 * HomeStickerScreen V3 — Sticker-based emotional home
 *
 * - Companion greeting card
 * - 2x3 emotion sticker grid → EmotionPicker
 * - Weekly emotion strip (7 days)
 * - CTA + recent entries
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  Animated, RefreshControl, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useThemeV2 } from '../design-system-v2';
import type { Theme } from '../design-system-v2';
import { diaryApi, emotionApi, companionApi } from '../api/client';
import type { Diary, CompanionProfile, EmotionKey } from '../types';
import {
  EMOTION_COLORS, EMOTION_LABELS, EMOTION_KEYS,
  EMOTION_STICKER_IMAGES,
} from '../constants/stickers';

const { width: SCREEN_W } = Dimensions.get('window');
const STICKER_SIZE = (SCREEN_W - 48 - 24) / 3; // 3 columns with gaps

export default function HomeStickerScreenV3() {
  const { theme } = useThemeV2();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const s = makeStyles(theme);

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

  // Weekly calendar strip data
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekStrip = getWeekStrip(weekly);

  return (
    <Animated.View style={[s.root, { paddingTop: insets.top, opacity: fade }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh}
            tintColor={theme.colors.primary} />
        }
      >
        {/* ═══ Companion Greeting Card ═══ */}
        {profile && (
          <TouchableOpacity
            style={s.greetingCard}
            onPress={() => nav.navigate('Companion')}
            activeOpacity={0.7}
          >
            <View style={s.greetingAvatar}>
              <Text style={s.greetingAvatarText}>{(profile.aiName || '마')[0]}</Text>
            </View>
            <View style={s.greetingBody}>
              <Text style={s.greetingName}>{profile.aiName || '마음이'}</Text>
              <Text style={s.greetingMsg} numberOfLines={2}>
                {msg?.message || greet}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ═══ Hero Question ═══ */}
        <View style={s.heroSection}>
          <Text style={s.heroSub}>{greet}</Text>
          <Text style={s.heroMain}>오늘 기분은 어때요?</Text>
        </View>

        {/* ═══ Emotion Sticker Grid (2x3) ═══ */}
        <View style={s.stickerGrid}>
          {EMOTION_KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              style={[s.stickerCard, { backgroundColor: EMOTION_COLORS[key] + '15' }]}
              onPress={() => handleStickerTap(key)}
              activeOpacity={0.6}
            >
              <Image source={EMOTION_STICKER_IMAGES[key]} style={s.stickerImage} />
              <Text style={[s.stickerLabel, { color: EMOTION_COLORS[key] }]}>
                {EMOTION_LABELS[key]}
              </Text>
            </TouchableOpacity>
          ))}
          {/* "모르겠어요" */}
          <TouchableOpacity
            style={[s.stickerCard, { backgroundColor: theme.colors.surfaceSecondary }]}
            onPress={() => nav.navigate('EmotionPicker', {})}
            activeOpacity={0.6}
          >
            <Text style={s.stickerIcon}>🤷</Text>
            <Text style={[s.stickerLabel, { color: theme.colors.textTertiary }]}>모르겠어요</Text>
          </TouchableOpacity>
        </View>

        {/* ═══ Weekly Emotion Strip ═══ */}
        <View style={s.weekSection}>
          <Text style={s.sectionLabel}>이번 주</Text>
          <View style={s.weekRow}>
            {weekStrip.map((entry, i) => (
              <View key={i} style={s.weekCol}>
                {entry.emotion ? (
                  <Image
                    source={EMOTION_STICKER_IMAGES[entry.emotion as EmotionKey]}
                    style={{ width: 24, height: 24, resizeMode: 'contain' }}
                  />
                ) : (
                  <View style={[
                    s.weekDot,
                    { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.colors.border },
                  ]} />
                )}
                <Text style={s.weekDay}>{weekDays[entry.dayOfWeek]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ═══ CTA ═══ */}
        <TouchableOpacity
          style={s.ctaButton}
          onPress={() => nav.navigate('DiaryList', { screen: 'WriteDiary' })}
          activeOpacity={0.8}
        >
          <Text style={s.ctaText}>오늘 기록 시작하기</Text>
        </TouchableOpacity>

        {/* ═══ Recent Entries (horizontal scroll) ═══ */}
        {diaries.length > 0 && (
          <View style={s.recentSection}>
            <View style={s.recentHeader}>
              <Text style={s.sectionLabel}>최근 기록</Text>
              <TouchableOpacity
                onPress={() => nav.navigate('DiaryList', { screen: 'DiaryListHome' })}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={s.linkText}>전체보기</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recentScroll}>
              {diaries.map((d) => {
                const date = new Date(d.diaryDate);
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={s.recentCard}
                    onPress={() => nav.navigate('DiaryList', {
                      screen: 'DiaryDetail', params: { diaryId: d.id },
                    })}
                    activeOpacity={0.7}
                  >
                    <Text style={s.recentDate}>
                      {date.getMonth() + 1}/{date.getDate()}
                    </Text>
                    <Text style={s.recentTitle} numberOfLines={1}>{d.title}</Text>
                    <Text style={s.recentPreview} numberOfLines={2}>{d.content}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </Animated.View>
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
    result.push({
      emotion: entry?.emotion || null,
      dayOfWeek: d.getDay(),
    });
  }
  return result;
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    scroll: { paddingHorizontal: t.spacing['2xl'], paddingBottom: 120 },

    // Greeting Card
    greetingCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: t.colors.primarySubtle, borderRadius: t.borderRadius.xl,
      paddingVertical: 18, paddingHorizontal: t.spacing.xl,
      marginTop: t.spacing.xl,
      shadowColor: '#6356D9', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
    },
    greetingAvatar: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: t.colors.primary,
      alignItems: 'center', justifyContent: 'center',
      marginRight: t.spacing.lg,
    },
    greetingAvatarText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
    greetingBody: { flex: 1 },
    greetingName: {
      ...t.typography.titleSmall, fontWeight: '700',
      color: t.colors.primary, marginBottom: 2,
    },
    greetingMsg: { ...t.typography.bodySmall, color: t.colors.textSecondary },

    // Hero
    heroSection: { alignItems: 'center', marginTop: t.spacing['5xl'], marginBottom: t.spacing['3xl'] },
    heroSub: {
      ...t.typography.bodyMedium, fontWeight: '300',
      color: t.colors.textTertiary, letterSpacing: 0.5, marginBottom: t.spacing.md,
    },
    heroMain: {
      ...t.typography.displayMedium, fontWeight: '700',
      color: t.colors.textPrimary, letterSpacing: -0.8,
    },

    // Sticker Grid
    stickerGrid: {
      flexDirection: 'row', flexWrap: 'wrap',
      justifyContent: 'center', gap: t.spacing.md,
      marginBottom: t.spacing['4xl'],
    },
    stickerCard: {
      width: STICKER_SIZE, height: STICKER_SIZE,
      borderRadius: t.borderRadius.xl,
      alignItems: 'center', justifyContent: 'center',
      gap: 6,
    },
    stickerIcon: { fontSize: 32 },
    stickerImage: { width: 48, height: 48, resizeMode: 'contain' as const },
    stickerLabel: { fontSize: 12, fontWeight: '600', letterSpacing: -0.2 },

    // Section
    sectionLabel: {
      ...t.typography.labelSmall, fontWeight: '600',
      color: t.colors.textTertiary, letterSpacing: 1.5,
      textTransform: 'uppercase' as const, textAlign: 'center' as const,
    },

    // Week
    weekSection: { alignItems: 'center', marginBottom: t.spacing['4xl'] },
    weekRow: {
      flexDirection: 'row', gap: t.spacing['2xl'],
      marginTop: t.spacing.xl,
    },
    weekCol: { alignItems: 'center', gap: t.spacing.sm },
    weekDot: { width: 20, height: 20, borderRadius: 10 },
    weekDay: { ...t.typography.caption, fontSize: 10, color: t.colors.textTertiary },

    // CTA
    ctaButton: {
      backgroundColor: t.colors.primary, borderRadius: t.borderRadius.lg,
      height: 54, alignItems: 'center', justifyContent: 'center',
      marginBottom: t.spacing['4xl'],
      shadowColor: '#6356D9', shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25, shadowRadius: 14, elevation: 4,
    },
    ctaText: { ...t.typography.labelLarge, color: t.colors.onPrimary, letterSpacing: -0.2 },

    // Recent
    recentSection: { marginBottom: t.spacing['3xl'] },
    recentHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: t.spacing.lg,
    },
    linkText: { ...t.typography.caption, color: t.colors.primary, fontWeight: '600' },
    recentScroll: { gap: t.spacing.md },
    recentCard: {
      width: 160, backgroundColor: t.colors.surface,
      borderRadius: t.borderRadius.lg, padding: t.spacing.lg,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    },
    recentDate: {
      ...t.typography.caption, color: t.colors.textTertiary,
      marginBottom: t.spacing.xs,
    },
    recentTitle: {
      ...t.typography.titleSmall, fontWeight: '600',
      color: t.colors.textPrimary, marginBottom: 4,
    },
    recentPreview: { ...t.typography.bodySmall, color: t.colors.textSecondary },
  });
}
