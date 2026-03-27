/**
 * ReflectionStory V3 — Redesigned reflection screen
 *
 * - Mini emotion calendar (current month)
 * - Weekly story cards (AI summary + emotion strip)
 * - Report list
 */

import React, { useCallback, useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useThemeV2 } from '../design-system-v2';
import type { Theme } from '../design-system-v2';
import { emotionApi, calendarApi, reportApi2 } from '../api/client';
import type { CalendarDayEntry, EmotionKey } from '../types';
import { EMOTION_COLORS, EMOTION_LABELS, EMOTION_KEYS } from '../constants/stickers';
import { EmotionStickerView } from './components/EmotionStickerView';

export default function ReflectionStoryV3() {
  const { theme } = useThemeV2();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const s = makeStyles(theme);

  const now = new Date();
  const [refreshing, setRefreshing] = useState(false);
  const [weekly, setWeekly] = useState<any>(null);
  const [calDays, setCalDays] = useState<CalendarDayEntry[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const loadData = useCallback(async () => {
    const [w, cal, reps] = await Promise.all([
      emotionApi.getWeeklySummary().catch(() => null),
      calendarApi.getCalendarV2(year, month).catch(() => ({ days: [] })),
      reportApi2.getAll().catch(() => []),
    ]);
    setWeekly(w);
    setCalDays(cal?.days || []);
    setReports(reps || []);
  }, [year, month]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  // Mini calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayMap = new Map(calDays.map(d => [d.date, d]));
  const todayStr = now.toISOString().slice(0, 10);

  // Weekly summary data
  const weeklyCalendar = weekly?.calendar || [];
  const weeklyDist = weekly?.emotionDistribution || {};

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <View style={{ height: 24 }} />
        <Text style={s.pageTitle}>돌아보기</Text>

        {/* ═══ Mini Emotion Calendar ═══ */}
        <TouchableOpacity
          style={s.calendarCard}
          onPress={() => nav.navigate('EmotionCalendar')}
          activeOpacity={0.7}
        >
          <View style={s.calHeader}>
            <Text style={s.calTitle}>{year}년 {month}월</Text>
            <Text style={s.calLink}>자세히 →</Text>
          </View>

          {/* Day headers */}
          <View style={s.calDayHeaders}>
            {['일', '월', '화', '수', '목', '금', '토'].map(d => (
              <View key={d} style={s.calDayHeaderCell}>
                <Text style={s.calDayHeaderText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Mini grid */}
          <View style={s.calGrid}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <View key={`e${i}`} style={s.calCell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const entry = dayMap.get(dateStr);
              const isToday = dateStr === todayStr;
              const emotionColor = entry?.primaryEmotionCode
                ? EMOTION_COLORS[entry.primaryEmotionCode]
                : null;

              return (
                <View key={day} style={s.calCell}>
                  {emotionColor && entry?.primaryEmotionCode ? (
                    <EmotionStickerView
                      emotionKey={entry.primaryEmotionCode}
                      size="tiny"
                      style={isToday ? { borderWidth: 1, borderColor: theme.colors.primary, borderRadius: 10 } : undefined}
                    />
                  ) : (
                    <View style={[
                      s.calDot,
                      { backgroundColor: theme.colors.surfaceSecondary },
                      isToday && { borderWidth: 1.5, borderColor: theme.colors.primary },
                    ]} />
                  )}
                </View>
              );
            })}
          </View>
        </TouchableOpacity>

        {/* ═══ Weekly Story Card ═══ */}
        {weekly && Object.keys(weeklyDist).length > 0 && (
          <View style={s.weeklyCard}>
            <Text style={s.sectionLabel}>이번 주 감정</Text>

            {/* Emotion strip */}
            <View style={s.emotionStrip}>
              {weeklyCalendar.slice(-7).map((entry: any, i: number) => {
                return entry.emotion ? (
                  <EmotionStickerView
                    key={i}
                    emotionKey={entry.emotion as EmotionKey}
                    size="mini"
                  />
                ) : (
                  <View key={i} style={[s.stripDot, { backgroundColor: theme.colors.border }]} />
                );
              })}
            </View>

            {/* Distribution */}
            <View style={s.distRow}>
              {Object.entries(weeklyDist).map(([emo, cnt]) => {
                const pct = weekly.totalEntries > 0
                  ? Math.round(((cnt as number) / weekly.totalEntries) * 100)
                  : 0;
                return (
                  <View key={emo} style={s.distItem}>
                    <EmotionStickerView emotionKey={emo as EmotionKey} size="mini" />
                    <Text style={s.distPct}>{pct}%</Text>
                    <Text style={s.distLabel}>{EMOTION_LABELS[emo as EmotionKey] || emo}</Text>
                  </View>
                );
              })}
            </View>

            {/* AI Summary (if available) */}
            {weekly.summary && (
              <View style={s.summaryBox}>
                <Text style={s.summaryText}>"{weekly.summary}"</Text>
              </View>
            )}
          </View>
        )}

        {/* ═══ Stats ═══ */}
        {weekly && (
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statNum}>{weekly.totalEntries || 0}</Text>
              <Text style={s.statLabel}>기록한 날</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statNum}>{weekly.averageScore || 0}</Text>
              <Text style={s.statLabel}>평균 기분</Text>
            </View>
          </View>
        )}

        {/* ═══ Reports ═══ */}
        {reports.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>리포트</Text>
            {reports.slice(0, 5).map((r: any) => (
              <TouchableOpacity
                key={r.id}
                style={s.reportItem}
                onPress={() => nav.navigate('ReportDetail', { reportId: r.id })}
                activeOpacity={0.6}
              >
                <View style={s.reportBadge}>
                  <Text style={s.reportType}>{r.reportType === 'WEEKLY' ? '주간' : '월간'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.reportTitle} numberOfLines={1}>{r.title}</Text>
                  <Text style={s.reportPeriod}>{r.periodStart} — {r.periodEnd}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    scroll: { paddingHorizontal: t.spacing['2xl'], paddingBottom: 120 },

    pageTitle: {
      ...t.typography.headlineLarge, fontWeight: '700',
      color: t.colors.textPrimary, textAlign: 'center',
      marginBottom: t.spacing['3xl'], letterSpacing: -0.5,
    },

    // Mini Calendar Card
    calendarCard: {
      backgroundColor: t.colors.surface, borderRadius: t.borderRadius.xl,
      padding: t.spacing.xl, marginBottom: t.spacing['2xl'],
      ...t.shadows.sm,
    },
    calHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: t.spacing.lg,
    },
    calTitle: { ...t.typography.titleSmall, fontWeight: '700', color: t.colors.textPrimary },
    calLink: { ...t.typography.caption, color: t.colors.primary, fontWeight: '600' },

    calDayHeaders: { flexDirection: 'row', marginBottom: 4 },
    calDayHeaderCell: { width: '14.28%' as any, alignItems: 'center' },
    calDayHeaderText: { fontSize: 9, color: t.colors.textTertiary },

    calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    calCell: { width: '14.28%' as any, height: 28, alignItems: 'center', justifyContent: 'center' },
    calDot: { width: 16, height: 16, borderRadius: 8 },

    // Section
    sectionLabel: {
      ...t.typography.labelSmall, fontWeight: '600',
      color: t.colors.textTertiary, letterSpacing: 1,
      textTransform: 'uppercase' as const, textAlign: 'center' as const,
      marginBottom: t.spacing.lg,
    },

    // Weekly card
    weeklyCard: {
      backgroundColor: t.colors.surface, borderRadius: t.borderRadius.xl,
      padding: t.spacing.xl, marginBottom: t.spacing['2xl'],
      ...t.shadows.sm,
    },

    emotionStrip: {
      flexDirection: 'row', justifyContent: 'center',
      gap: 8, marginBottom: t.spacing.xl,
    },
    stripDot: { width: 14, height: 14, borderRadius: 7 },

    distRow: { flexDirection: 'row', justifyContent: 'center', gap: t.spacing.xl },
    distItem: { alignItems: 'center', gap: 4 },
    distDot: { width: 10, height: 10, borderRadius: 5 },
    distPct: { fontSize: 14, fontWeight: '700', color: t.colors.textPrimary, letterSpacing: -0.5 },
    distLabel: { fontSize: 10, color: t.colors.textTertiary },

    summaryBox: {
      marginTop: t.spacing.xl, backgroundColor: t.colors.primarySubtle,
      borderRadius: t.borderRadius.lg, padding: t.spacing.lg,
    },
    summaryText: {
      ...t.typography.bodySmall, color: t.colors.textSecondary,
      fontStyle: 'italic', lineHeight: 20, textAlign: 'center',
    },

    // Stats
    statsRow: {
      flexDirection: 'row', justifyContent: 'center',
      gap: t.spacing['5xl'], marginBottom: t.spacing['3xl'],
    },
    statBox: { alignItems: 'center' },
    statNum: { fontSize: 32, fontWeight: '200', color: t.colors.primary, letterSpacing: -2 },
    statLabel: { fontSize: 11, color: t.colors.textTertiary, marginTop: 4, letterSpacing: 0.3 },

    // Reports
    section: { marginBottom: t.spacing['2xl'] },
    reportItem: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 14, borderBottomWidth: 1,
      borderBottomColor: t.colors.borderSubtle, gap: 12,
    },
    reportBadge: {
      backgroundColor: t.colors.primarySubtle,
      paddingHorizontal: 8, paddingVertical: 4,
      borderRadius: t.borderRadius.sm,
    },
    reportType: { fontSize: 10, fontWeight: '700', color: t.colors.primary, textTransform: 'uppercase' },
    reportTitle: { ...t.typography.titleSmall, fontWeight: '600', color: t.colors.textPrimary },
    reportPeriod: { ...t.typography.caption, color: t.colors.textTertiary, marginTop: 2 },
  });
}
