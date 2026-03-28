/**
 * ReflectionStory V3 — Redesigned reflection screen (v3 design system)
 *
 * - Mini emotion calendar (current month)
 * - Weekly story cards (AI summary + emotion strip)
 * - Report list
 */

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, fontFamily, shadows, spacing, borderRadius } from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import { emotionApi, calendarApi, reportApi2 } from '../api/client';
import type { CalendarDayEntry, EmotionKey } from '../types';
import { EMOTION_COLORS, EMOTION_LABELS, EMOTION_KEYS } from '../constants/stickers';
import { EmotionStickerView } from './components/EmotionStickerView';

// Organic blob border radii for emotion day cells
const blobRadii = [
  { borderTopLeftRadius: 8, borderTopRightRadius: 10, borderBottomRightRadius: 9, borderBottomLeftRadius: 11 },
  { borderTopLeftRadius: 10, borderTopRightRadius: 8, borderBottomRightRadius: 11, borderBottomLeftRadius: 9 },
  { borderTopLeftRadius: 9, borderTopRightRadius: 11, borderBottomRightRadius: 8, borderBottomLeftRadius: 10 },
  { borderTopLeftRadius: 11, borderTopRightRadius: 9, borderBottomRightRadius: 10, borderBottomLeftRadius: 8 },
  { borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomRightRadius: 8, borderBottomLeftRadius: 11 },
];

export default function ReflectionStoryV3() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();

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
    <PaperBackground variant="lined" color="warm" style={{ flex: 1, paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentPrimary} />}
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
              const hasEmotion = !!entry?.primaryEmotionCode;

              return (
                <View key={day} style={s.calCell}>
                  {hasEmotion ? (
                    <View style={[
                      s.calDot,
                      blobRadii[day % 5],
                      isToday && { borderWidth: 1.5, borderColor: colors.accentPrimary },
                    ]}>
                      <EmotionStickerView
                        emotionKey={entry.primaryEmotionCode}
                        size="tiny"
                      />
                    </View>
                  ) : (
                    <View style={[
                      s.calDotEmpty,
                      isToday && { borderWidth: 1.5, borderColor: colors.accentPrimary },
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
                  <View key={i} style={s.stripDot} />
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
    </PaperBackground>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: spacing['2xl'], paddingBottom: 120 },

  pageTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 24,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing['3xl'],
    letterSpacing: -0.5,
  },

  // Mini Calendar Card
  calendarCard: {
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.sm,
    padding: spacing.xl,
    marginBottom: spacing['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...shadows.crisp,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  calTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 18,
    color: colors.textPrimary,
  },
  calLink: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    color: colors.accentPrimary,
  },

  calDayHeaders: { flexDirection: 'row', marginBottom: 4 },
  calDayHeaderCell: { width: '14.28%' as any, alignItems: 'center' },
  calDayHeaderText: {
    fontFamily: fontFamily.sans,
    fontSize: 9,
    color: colors.textTertiary,
  },

  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%' as any, height: 28, alignItems: 'center', justifyContent: 'center' },
  calDot: { width: 20, height: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  calDotEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accentSand + '20',
  },

  // Section
  sectionLabel: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 14,
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    textAlign: 'center' as const,
    marginBottom: spacing.lg,
  },

  // Weekly card
  weeklyCard: {
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.sm,
    padding: spacing.xl,
    marginBottom: spacing['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...shadows.crisp,
  },

  emotionStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.xl,
  },
  stripDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.accentSand + '40',
  },

  distRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl },
  distItem: { alignItems: 'center', gap: 4 },
  distPct: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  distLabel: {
    fontFamily: fontFamily.sans,
    fontSize: 10,
    color: colors.textTertiary,
  },

  summaryBox: {
    marginTop: spacing.xl,
    backgroundColor: colors.accentPrimaryLight + '30',
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
  },
  summaryText: {
    fontFamily: fontFamily.script,
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing['5xl'],
    marginBottom: spacing['3xl'],
  },
  statBox: { alignItems: 'center' },
  statNum: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 32,
    fontWeight: '200',
    color: colors.accentPrimary,
    letterSpacing: -2,
  },
  statLabel: {
    fontFamily: fontFamily.sans,
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
    letterSpacing: 0.3,
  },

  // Reports
  section: { marginBottom: spacing['2xl'] },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.accentSand + '30',
    gap: 12,
  },
  reportBadge: {
    backgroundColor: colors.accentPrimaryLight + '40',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.xs,
  },
  reportType: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 10,
    color: colors.accentPrimary,
    textTransform: 'uppercase',
  },
  reportTitle: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  reportPeriod: {
    fontFamily: fontFamily.sans,
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
