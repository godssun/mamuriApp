/**
 * EmotionCalendar V3 — Monthly emotion archive with scrapbook aesthetic
 *
 * - Paper texture background with lined overlay
 * - Blob-shaped emotion cells (not circles)
 * - Editorial serif month titles
 * - Scrapbook card emotion distribution
 */

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  colors, typography, fontFamily, shadows, spacing, borderRadius, layout,
  PaperBackground,
} from '../design-system-v3';
import { calendarApi } from '../api/client';
import type { CalendarDayEntry } from '../types';
import { EMOTION_COLORS, EMOTION_LABELS, EMOTION_KEYS } from '../constants/stickers';
import { EmotionStickerView } from './components/EmotionStickerView';

const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토'];

const blobRadii = [
  { borderTopLeftRadius: 16, borderTopRightRadius: 22, borderBottomRightRadius: 18, borderBottomLeftRadius: 24 },
  { borderTopLeftRadius: 22, borderTopRightRadius: 16, borderBottomRightRadius: 24, borderBottomLeftRadius: 18 },
  { borderTopLeftRadius: 20, borderTopRightRadius: 24, borderBottomRightRadius: 16, borderBottomLeftRadius: 22 },
  { borderTopLeftRadius: 24, borderTopRightRadius: 18, borderBottomRightRadius: 22, borderBottomLeftRadius: 16 },
  { borderTopLeftRadius: 18, borderTopRightRadius: 22, borderBottomRightRadius: 20, borderBottomLeftRadius: 24 },
];

export default function EmotionCalendarV3() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState<CalendarDayEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const result = await calendarApi.getCalendarV2(year, month);
      setDays(result.days || []);
    } catch {
      setDays([]);
    }
  }, [year, month]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const changeMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setYear(y);
    setMonth(m);
  };

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  // Calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayMap = new Map(days.map(d => [d.date, d]));
  const todayStr = new Date().toISOString().slice(0, 10);

  // Emotion distribution
  const emotionCounts: Record<string, number> = {};
  days.forEach(d => {
    if (d.primaryEmotionCode) {
      emotionCounts[d.primaryEmotionCode] = (emotionCounts[d.primaryEmotionCode] || 0) + d.diaryCount;
    }
  });
  const totalEntries = Object.values(emotionCounts).reduce((a, b) => a + b, 0);

  const handleDayPress = (dateStr: string) => {
    const entry = dayMap.get(dateStr);
    if (entry && entry.diaryCount > 0) {
      nav.navigate('MainTabs', {
        screen: 'DiaryList',
        params: {
          screen: 'DiaryListHome',
          params: { filterDate: dateStr },
        },
      });
    }
  };

  return (
    <PaperBackground variant="plain" color="warm" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
          <Text style={s.backText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>감정 아카이브</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentPrimary} />}
      >
        {/* Month Navigation */}
        <View style={s.monthNav}>
          <TouchableOpacity onPress={() => changeMonth(-1)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.navArrow}>{'\u2039'}</Text>
          </TouchableOpacity>
          <Text style={s.monthTitle}>
            {year}년 {month}월
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.navArrow}>{'\u203A'}</Text>
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={s.dayHeaderRow}>
          {DAY_HEADERS.map((d) => (
            <View key={d} style={s.dayHeaderCell}>
              <Text style={s.dayHeaderText}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={s.calGrid}>
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <View key={`empty-${i}`} style={s.calCell} />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const entry = dayMap.get(dateStr);
            const isToday = dateStr === todayStr;
            const emotionColor = entry?.primaryEmotionCode
              ? EMOTION_COLORS[entry.primaryEmotionCode]
              : null;
            const blob = blobRadii[day % 5];

            return (
              <TouchableOpacity
                key={day}
                style={s.calCell}
                onPress={() => handleDayPress(dateStr)}
                activeOpacity={0.6}
              >
                <View style={[
                  s.calDot,
                  emotionColor
                    ? { ...blob, backgroundColor: emotionColor + '30' }
                    : { backgroundColor: 'transparent' },
                  isToday && s.calDotToday,
                ]}>
                  {emotionColor && entry?.primaryEmotionCode ? (
                    <EmotionStickerView emotionKey={entry.primaryEmotionCode} size="small" />
                  ) : (
                    <Text style={[
                      s.calDayNum,
                      isToday && { color: colors.accentPrimary },
                    ]}>
                      {day}
                    </Text>
                  )}
                </View>
                <Text style={[
                  s.calDayNumBelow,
                  emotionColor ? { color: colors.textSecondary } : { color: colors.textTertiary },
                  isToday && { color: colors.accentPrimary, fontWeight: '700' as const },
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Emotion Distribution — Scrapbook Card */}
        {totalEntries > 0 && (
          <View style={s.distCard}>
            <Text style={s.sectionLabel}>이번 달 감정 분포</Text>

            {/* Blob legend items */}
            <View style={s.distLegend}>
              {EMOTION_KEYS.map((key) => {
                const count = emotionCounts[key] || 0;
                if (count === 0) return null;
                const blobShape = blobRadii[EMOTION_KEYS.indexOf(key) % 5];
                return (
                  <View key={key} style={s.legendItem}>
                    <View style={[s.legendBlob, blobShape, { backgroundColor: EMOTION_COLORS[key] + '40' }]}>
                      <EmotionStickerView emotionKey={key} size="tiny" />
                    </View>
                    <Text style={s.legendText}>{EMOTION_LABELS[key]}</Text>
                    <Text style={s.legendCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </PaperBackground>
  );
}

const s = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.textTertiary + '30',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontFamily: fontFamily.sans,
    fontSize: 22,
    color: colors.textPrimary,
  },
  headerTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 18,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },

  scroll: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: 120,
  },

  // Month nav
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['3xl'],
    marginTop: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  monthTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 24,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  navArrow: {
    fontFamily: fontFamily.sans,
    fontSize: 24,
    color: colors.textSecondary,
  },

  // Day headers
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  dayHeaderCell: {
    width: '14.28%' as any,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontFamily: fontFamily.sans,
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 0.3,
  },

  // Calendar grid
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: '14.28%' as any,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  calDot: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDotToday: {
    borderWidth: 2,
    borderColor: colors.accentPrimary,
  },
  calDayNum: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  calDayNumBelow: {
    fontFamily: fontFamily.sans,
    fontSize: 9,
    marginTop: 1,
  },

  // Distribution card
  distCard: {
    marginTop: spacing['3xl'],
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.sm,
    padding: spacing.xl,
    ...shadows.crisp,
  },
  sectionLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    textAlign: 'center' as const,
    marginBottom: spacing.lg,
  },

  distLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBlob: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendText: {
    fontFamily: fontFamily.sans,
    fontSize: 11,
    color: colors.textSecondary,
  },
  legendCount: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '600',
  },
});
