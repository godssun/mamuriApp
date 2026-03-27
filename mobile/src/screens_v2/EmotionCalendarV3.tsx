/**
 * EmotionCalendar V3 — Monthly calendar with emotion colors
 *
 * - Calendar grid (7 columns)
 * - Emotion color dots per day
 * - Month navigation
 * - Bottom: emotion distribution bar
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useThemeV2 } from '../design-system-v2';
import type { Theme } from '../design-system-v2';
import { calendarApi, diaryApi } from '../api/client';
import type { CalendarDayEntry, EmotionKey } from '../types';
import { EMOTION_COLORS, EMOTION_LABELS, EMOTION_KEYS } from '../constants/stickers';

const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토'];

export default function EmotionCalendarV3() {
  const { theme } = useThemeV2();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const s = makeStyles(theme);

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
      nav.navigate('DiaryList', {
        screen: 'DiaryListHome',
        params: { filterDate: dateStr },
      });
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>감정 캘린더</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Month Navigation */}
        <View style={s.monthNav}>
          <TouchableOpacity onPress={() => changeMonth(-1)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.navArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={s.monthTitle}>
            {year}년 {month}월
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.navArrow}>{'>'}</Text>
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
                    ? { backgroundColor: emotionColor }
                    : { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
                  isToday && s.calDotToday,
                ]}>
                  <Text style={[
                    s.calDayNum,
                    { color: emotionColor ? '#FFFFFF' : theme.colors.textTertiary },
                    isToday && !emotionColor && { color: theme.colors.primary },
                  ]}>
                    {day}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Emotion Distribution Bar */}
        {totalEntries > 0 && (
          <View style={s.distSection}>
            <Text style={s.sectionLabel}>이번 달 감정 분포</Text>

            {/* Bar */}
            <View style={s.distBar}>
              {EMOTION_KEYS.map((key) => {
                const count = emotionCounts[key] || 0;
                if (count === 0) return null;
                const pct = (count / totalEntries) * 100;
                return (
                  <View
                    key={key}
                    style={[s.distBarSegment, {
                      backgroundColor: EMOTION_COLORS[key],
                      width: `${pct}%` as any,
                    }]}
                  />
                );
              })}
            </View>

            {/* Legend */}
            <View style={s.distLegend}>
              {EMOTION_KEYS.map((key) => {
                const count = emotionCounts[key] || 0;
                if (count === 0) return null;
                return (
                  <View key={key} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: EMOTION_COLORS[key] }]} />
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
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    header: {
      height: 56, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', paddingHorizontal: t.layout.screenPaddingH,
      borderBottomWidth: 1, borderBottomColor: t.colors.borderSubtle,
    },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    backText: { ...t.typography.titleLarge, color: t.colors.textPrimary },
    headerTitle: { ...t.typography.titleSmall, fontWeight: '600', color: t.colors.textPrimary },

    scroll: { paddingHorizontal: t.spacing['2xl'], paddingBottom: 120 },

    // Month nav
    monthNav: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: t.spacing['3xl'], marginTop: t.spacing['2xl'], marginBottom: t.spacing.xl,
    },
    monthTitle: { ...t.typography.titleLarge, color: t.colors.textPrimary, fontWeight: '700' },
    navArrow: { fontSize: 20, color: t.colors.textTertiary, fontWeight: '500' },

    // Day headers
    dayHeaderRow: { flexDirection: 'row', marginBottom: t.spacing.sm },
    dayHeaderCell: { width: '14.28%' as any, alignItems: 'center' },
    dayHeaderText: { ...t.typography.caption, color: t.colors.textTertiary, fontSize: 11 },

    // Calendar grid
    calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    calCell: { width: '14.28%' as any, height: 52, alignItems: 'center', justifyContent: 'center' },
    calDot: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
    },
    calDotToday: {
      borderWidth: 2, borderColor: t.colors.primary,
    },
    calDayNum: { fontSize: 12, fontWeight: '500' },

    // Distribution
    distSection: { marginTop: t.spacing['3xl'] },
    sectionLabel: {
      ...t.typography.labelSmall, fontWeight: '600',
      color: t.colors.textTertiary, letterSpacing: 1,
      textTransform: 'uppercase' as const, textAlign: 'center' as const,
      marginBottom: t.spacing.xl,
    },

    distBar: {
      flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden',
      backgroundColor: t.colors.surfaceSecondary,
    },
    distBarSegment: { height: 12 },

    distLegend: {
      flexDirection: 'row', flexWrap: 'wrap',
      justifyContent: 'center', gap: t.spacing.lg,
      marginTop: t.spacing.xl,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { ...t.typography.caption, color: t.colors.textSecondary },
    legendCount: { ...t.typography.caption, color: t.colors.textTertiary, fontWeight: '600' },
  });
}
