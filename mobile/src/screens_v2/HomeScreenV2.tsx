/**
 * HomeScreen v5 — Premium emotional journal home
 *
 * Design decisions (documented for design review):
 *
 * TYPOGRAPHY HIERARCHY:
 *   - Greeting: displayMedium (28pt/700) — the hero text, commands attention
 *   - Sub-greeting: bodyMedium (15pt/300) — whispered, not competing
 *   - Section titles: labelSmall (11pt/600) uppercase tracking — architectural label
 *   - Card title: titleSmall (14pt/600) — confident but not loud
 *   - Body text: bodySmall (13pt/400) — reads easily, doesn't dominate
 *   - Big number: 72pt/200 — editorial statement piece
 *
 * SPACING RHYTHM (8pt grid, geometric progression):
 *   - Between greeting and emotions: 48px (6xl) — dramatic pause
 *   - Between sections: 40px (5xl) — clear separation
 *   - Card internal: 20px (xl) — comfortable breathing
 *   - Icon-to-text: 8px (sm) — tight coupling
 *
 * COLOR RULES:
 *   - Accent (indigo #6356D9): interactive elements, emphasis, CTA
 *   - Accent-soft (#ECEAFF): card backgrounds, hover states
 *   - Text primary (#1A1A1A): headings, titles
 *   - Text secondary (#6E6B64): body, descriptions
 *   - Text tertiary (#B5B5AD): labels, captions, timestamps
 *   - Emotion colors: ONLY on emotion selection circles (nowhere else)
 *
 * CARD RULES:
 *   - No border (borderWidth: 0)
 *   - Background tint only (accent-soft or surface)
 *   - border-radius: 20px (xl) for primary cards
 *   - padding: 20-24px
 *   - No drop shadow (editorial flat)
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, RefreshControl, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useThemeV2 } from '../design-system-v2';
import type { Theme } from '../design-system-v2';
import { diaryApi, emotionApi, companionApi } from '../api/client';
import type { Diary, CompanionProfile } from '../types';

// ── Emotion palette (used ONLY in emotion check-in) ──
const EMOTION = {
  JOY:     { color: '#F2C94C', label: '좋아요' },
  CALM:    { color: '#6FCF97', label: '괜찮아요' },
  SAD:     { color: '#6E9ECF', label: '별로예요' },
  ANXIOUS: { color: '#E09B6C', label: '힘들어요' },
  COMPLEX: { color: '#A99EC4', label: '복잡해요' },
} as const;

const EMOTION_KEYS = Object.keys(EMOTION) as (keyof typeof EMOTION)[];

export default function HomeScreenV2() {
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
    setDiaries((d || []).slice(0, 3));
    setWeekly(w);
    setMsg(m);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const writeWithEmotion = (key: string) => {
    nav.navigate('DiaryList', { screen: 'WriteDiary', params: { preselectedEmotion: key } });
  };

  const h = new Date().getHours();
  const greet = h < 6 ? '고요한 밤' : h < 12 ? '좋은 아침' : h < 18 ? '좋은 오후' : '좋은 저녁';

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
        {/* ═══════ Hero Greeting ═══════ */}
        <View style={s.heroSection}>
          <Text style={s.heroSub}>{greet},</Text>
          <Text style={s.heroMain}>오늘 하루는</Text>
          <Text style={s.heroMain}>어떠셨어요?</Text>
        </View>

        {/* ═══════ Emotion Check-in — Pill Chips ═══════ */}
        <View style={s.emotionSection}>
          {EMOTION_KEYS.map((key) => {
            const e = EMOTION[key];
            return (
              <TouchableOpacity
                key={key}
                style={[s.emotionChip, { backgroundColor: e.color + '18' }]}
                activeOpacity={0.6}
                onPress={() => writeWithEmotion(key)}
              >
                <View style={[s.emotionChipDot, { backgroundColor: e.color }]} />
                <Text style={[s.emotionChipText, { color: e.color }]}>{e.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ═══════ Companion Message ═══════ */}
        {profile && (
          <TouchableOpacity
            style={s.companionCard}
            onPress={() => nav.navigate('Companion')}
            activeOpacity={0.6}
          >
            <View style={s.companionAvatar} />
            <View style={s.companionBody}>
              <Text style={s.companionName}>{profile.aiName || '마음이'}</Text>
              <Text style={s.companionMsg} numberOfLines={2}>
                {msg?.message || '오늘도 이야기 들려주세요'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ═══════ Weekly Emotion Dots ═══════ */}
        {weekly?.calendar?.length > 0 && (
          <View style={s.weekSection}>
            <Text style={s.sectionLabel}>이번 주</Text>
            <View style={s.weekRow}>
              {weekly.calendar.slice(-7).map((entry: any, i: number) => {
                const dotColor = EMOTION[entry.emotion as keyof typeof EMOTION]?.color
                  || theme.colors.border;
                const day = ['일','월','화','수','목','금','토'][new Date(entry.date).getDay()];
                return (
                  <View key={i} style={s.weekCol}>
                    <View style={[s.weekDot, { backgroundColor: dotColor }]} />
                    <Text style={s.weekDay}>{day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ═══════ Days Counter (Editorial) ═══════ */}
        {profile && profile.diaryCount > 0 && (
          <View style={s.counterSection}>
            <Text style={s.counterNumber}>{profile.diaryCount}</Text>
            <Text style={s.counterLabel}>days of journaling</Text>
          </View>
        )}

        {/* ═══════ Recent Entries ═══════ */}
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
            {diaries.map((d, i) => {
              const date = new Date(d.diaryDate);
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[s.entryRow, i < diaries.length - 1 && s.entryDivider]}
                  onPress={() => nav.navigate('DiaryList', {
                    screen: 'DiaryDetail', params: { diaryId: d.id },
                  })}
                  activeOpacity={0.5}
                >
                  <View style={s.entryDateBadge}>
                    <Text style={s.entryDateNum}>{date.getDate()}</Text>
                  </View>
                  <View style={s.entryContent}>
                    <Text style={s.entryTitle} numberOfLines={1}>{d.title}</Text>
                    <Text style={s.entryPreview} numberOfLines={1}>{d.content}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ═══════ CTA Button ═══════ */}
        <TouchableOpacity
          style={s.ctaButton}
          onPress={() => nav.navigate('DiaryList', { screen: 'WriteDiary' })}
          activeOpacity={0.8}
        >
          <Text style={s.ctaText}>오늘의 기록 남기기</Text>
        </TouchableOpacity>

        <View style={{ height: theme.spacing['5xl'] }} />
      </ScrollView>
    </Animated.View>
  );
}

/* ══════════════════════════════════════════════════════════
   Styles — using design system tokens
   Every value references a design decision above
   ══════════════════════════════════════════════════════════ */
function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: t.colors.background,  // #FAFAF8
    },
    scroll: {
      paddingHorizontal: t.spacing['2xl'],    // 24px — standard screen padding
      paddingBottom: 120,
    },

    // ── Hero ──
    heroSection: {
      alignItems: 'center',
      marginTop: t.spacing['7xl'],            // 80px — dramatic top breathing room
      marginBottom: t.spacing['6xl'],         // 64px — clear separation from emotions
    },
    heroSub: {
      ...t.typography.bodyMedium,             // 15pt
      fontWeight: '300',                      // light — whispered
      color: t.colors.textTertiary,
      letterSpacing: 1,
      marginBottom: t.spacing.lg,             // 16px
    },
    heroMain: {
      ...t.typography.displayMedium,          // 28pt
      fontWeight: '700',                      // bold — commands attention
      color: t.colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.8,
      lineHeight: 38,
    },

    // ── Emotions — pill chips with tinted backgrounds ──
    emotionSection: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: t.spacing.sm,                      // 8px
      marginBottom: t.spacing['6xl'],         // 64px
    },
    emotionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      gap: 6,
    },
    emotionChipDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    emotionChipText: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: -0.2,
    },

    // ── Companion (Linear-style card: subtle shadow + tinted bg) ──
    companionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.primarySubtle,  // #F0EEFF
      borderRadius: t.borderRadius.xl,          // 20px
      paddingVertical: 22,                      // slightly more than xl
      paddingHorizontal: t.spacing['2xl'],      // 24px
      marginBottom: t.spacing['5xl'],           // 48px
      // Things 3 / Linear style micro-shadow
      shadowColor: '#6356D9',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    companionAvatar: {
      width: t.layout.avatarSm,                // 36px
      height: t.layout.avatarSm,
      borderRadius: t.layout.avatarSm / 2,
      backgroundColor: t.colors.primary,        // solid indigo
      marginRight: t.spacing.lg,               // 16px
    },
    companionBody: { flex: 1 },
    companionName: {
      ...t.typography.titleSmall,              // 14pt/500
      fontWeight: '700',
      color: t.colors.primary,
      marginBottom: 3,
    },
    companionMsg: {
      ...t.typography.bodySmall,               // 13pt/400
      color: t.colors.textSecondary,
    },

    // ── Section Label ──
    sectionLabel: {
      ...t.typography.labelSmall,              // 11pt
      fontWeight: '600',
      color: t.colors.textTertiary,
      letterSpacing: 1.5,
      textTransform: 'uppercase' as const,
      textAlign: 'center' as const,
    },

    // ── Weekly ──
    weekSection: {
      alignItems: 'center',
      marginBottom: t.spacing['5xl'],         // 48px
    },
    weekRow: {
      flexDirection: 'row',
      gap: t.spacing['2xl'],                   // 24px — generous dot spacing
      marginTop: t.spacing.xl,                // 20px
    },
    weekCol: { alignItems: 'center', gap: t.spacing.sm },
    weekDot: { width: 12, height: 12, borderRadius: 6 },
    weekDay: {
      ...t.typography.caption,
      fontSize: 10,
      color: t.colors.textTertiary,
    },

    // ── Counter ──
    counterSection: {
      alignItems: 'center',
      marginBottom: t.spacing['5xl'],         // 48px
    },
    counterNumber: {
      fontSize: 72,
      fontWeight: '200',                       // ultra-light — editorial statement
      color: t.colors.primary,
      letterSpacing: -4,
    },
    counterLabel: {
      ...t.typography.labelSmall,
      color: t.colors.textTertiary,
      letterSpacing: 2,
      textTransform: 'uppercase' as const,
      marginTop: t.spacing.sm,
    },

    // ── Recent (Linear-style: card wrapper with subtle shadow) ──
    recentSection: {
      marginBottom: t.spacing['5xl'],         // 48px
      backgroundColor: t.colors.surface,
      borderRadius: t.borderRadius.xl,        // 20px
      padding: t.spacing.xl,                  // 20px
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 1,
    },
    recentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: t.spacing.lg,             // 16px
    },
    linkText: {
      ...t.typography.caption,
      color: t.colors.primary,
      fontWeight: '600',
    },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: t.spacing.lg,          // 16px
    },
    entryDivider: {
      borderBottomWidth: 1,
      borderBottomColor: t.colors.borderSubtle,
    },
    entryDateBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: t.colors.primarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: t.spacing.lg,
    },
    entryDateNum: {
      ...t.typography.titleSmall,
      fontWeight: '700',
      color: t.colors.primary,
    },
    entryContent: { flex: 1 },
    entryTitle: {
      ...t.typography.titleSmall,             // 14pt/500
      fontWeight: '600',
      color: t.colors.textPrimary,
      marginBottom: 2,
    },
    entryPreview: {
      ...t.typography.bodySmall,              // 13pt/400
      color: t.colors.textSecondary,
    },

    // ── CTA (Calm-style glow shadow) ──
    ctaButton: {
      backgroundColor: t.colors.primary,
      borderRadius: t.borderRadius.lg,        // 16px
      height: 54,                             // slightly taller for premium
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#6356D9',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 14,
      elevation: 4,
    },
    ctaText: {
      ...t.typography.labelLarge,             // 15pt/600
      color: t.colors.onPrimary,
      letterSpacing: -0.2,
    },
  });
}
