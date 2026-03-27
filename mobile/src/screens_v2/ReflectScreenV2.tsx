/**
 * Reflect Screen v3 — One Year-inspired
 * Emotion calendar as dot grid, minimal stats, centered layout
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useThemeV2 } from '../design-system-v2';
import { emotionApi, reportApi2 } from '../api/client';

const ACCENT = '#6356D9';
const ACCENT_LIGHT = '#F0EEFF';
const BG = '#FAFAF8';
const TEXT = '#1C1B18';
const TEXT_SUB = '#918E86';
const TEXT_FAINT = '#C4C1B9';
const DIVIDER = '#F0EFE9';

const EMOTION_LABELS: Record<string, string> = {
  JOY: '좋아요', CALM: '괜찮아요', SAD: '별로예요', ANXIOUS: '힘들어요', COMPLEX: '복잡해요',
};

export default function ReflectScreenV2() {
  const { theme } = useThemeV2();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [weekly, setWeekly] = useState<any>(null);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

  const loadData = useCallback(async () => {
    const [w, cal, reps] = await Promise.all([
      emotionApi.getWeeklySummary().catch(() => null),
      emotionApi.getCalendar(selectedMonth.year, selectedMonth.month).catch(() => ({ calendar: [] })),
      reportApi2.getAll().catch(() => []),
    ]);
    setWeekly(w);
    setCalendar(cal?.calendar || []);
    setReports(reps || []);
  }, [selectedMonth]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const changeMonth = (d: number) => {
    setSelectedMonth(p => {
      let m = p.month + d, y = p.year;
      if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
      return { year: y, month: m };
    });
  };

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        <View style={{ height: 24 }} />

        {/* Title */}
        <Text style={st.pageTitle}>돌아보기</Text>

        {/* Weekly summary */}
        {weekly?.emotionDistribution && Object.keys(weekly.emotionDistribution).length > 0 && (
          <View style={st.section}>
            <Text style={st.sectionLabel}>이번 주 감정</Text>
            <View style={st.distRow}>
              {Object.entries(weekly.emotionDistribution).map(([emo, cnt]) => {
                const pct = weekly.totalEntries > 0 ? Math.round(((cnt as number) / weekly.totalEntries) * 100) : 0;
                return (
                  <View key={emo} style={st.distItem}>
                    <View style={st.distDot} />
                    <Text style={st.distPct}>{pct}%</Text>
                    <Text style={st.distLabel}>{EMOTION_LABELS[emo] || emo}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Dot grid calendar */}
        <View style={st.section}>
          <View style={st.calNav}>
            <TouchableOpacity onPress={() => changeMonth(-1)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={st.calArrow}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={st.calTitle}>{selectedMonth.year}.{String(selectedMonth.month).padStart(2, '0')}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={st.calArrow}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          <View style={st.dotGrid}>
            {generateDotGrid(selectedMonth.year, selectedMonth.month, calendar)}
          </View>
        </View>

        {/* Stats */}
        {weekly && (
          <View style={st.statsRow}>
            <View style={st.statBox}>
              <Text style={st.statNum}>{weekly.totalEntries}</Text>
              <Text style={st.statLabel}>기록한 날</Text>
            </View>
            <View style={st.statBox}>
              <Text style={st.statNum}>{weekly.averageScore || 0}</Text>
              <Text style={st.statLabel}>평균 기분</Text>
            </View>
          </View>
        )}

        {/* Reports */}
        {reports.length > 0 && (
          <View style={st.section}>
            <Text style={st.sectionLabel}>리포트</Text>
            {reports.slice(0, 3).map((r: any) => (
              <TouchableOpacity key={r.id} style={st.reportItem} activeOpacity={0.6}>
                <Text style={st.reportType}>{r.reportType === 'WEEKLY' ? '주간' : '월간'}</Text>
                <Text style={st.reportTitle} numberOfLines={1}>{r.title}</Text>
                <Text style={st.reportPeriod}>{r.periodStart} — {r.periodEnd}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

function generateDotGrid(year: number, month: number, calendar: any[]) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const calMap = new Map(calendar.map((e: any) => [e.date, e]));
  const cells: React.ReactNode[] = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(<View key={`e${i}`} style={st.dotCell} />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const hasEntry = calMap.has(dateStr);
    const isToday = dateStr === new Date().toISOString().slice(0, 10);

    cells.push(
      <View key={d} style={st.dotCell}>
        <View style={[
          st.calDot,
          hasEntry && st.calDotFilled,
          isToday && st.calDotToday,
        ]} />
      </View>
    );
  }

  return cells;
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 32, paddingBottom: 120 },

  pageTitle: { fontSize: 24, fontWeight: '700', color: TEXT, textAlign: 'center', marginBottom: 40, letterSpacing: -0.5 },

  section: { marginBottom: 44 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: TEXT_SUB, letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center', marginBottom: 20 },

  // Distribution
  distRow: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  distItem: { alignItems: 'center', gap: 6 },
  distDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: ACCENT },
  distPct: { fontSize: 16, fontWeight: '700', color: TEXT, letterSpacing: -0.5 },
  distLabel: { fontSize: 10, color: TEXT_FAINT },

  // Calendar dot grid
  calNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 24 },
  calTitle: { fontSize: 14, fontWeight: '600', color: TEXT, letterSpacing: 0.5 },
  calArrow: { fontSize: 16, color: TEXT_FAINT, fontWeight: '500' },

  dotGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  dotCell: { width: '14.28%' as any, height: 32, alignItems: 'center', justifyContent: 'center' },
  calDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ECEAE4' },
  calDotFilled: { backgroundColor: ACCENT },
  calDotToday: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: ACCENT, backgroundColor: 'transparent' },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 48, marginBottom: 44 },
  statBox: { alignItems: 'center' },
  statNum: { fontSize: 32, fontWeight: '200', color: ACCENT, letterSpacing: -2 },
  statLabel: { fontSize: 11, color: TEXT_FAINT, marginTop: 4, letterSpacing: 0.3 },

  // Reports
  reportItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: DIVIDER },
  reportType: { fontSize: 10, fontWeight: '600', color: ACCENT, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  reportTitle: { fontSize: 14, fontWeight: '600', color: TEXT, letterSpacing: -0.2, marginBottom: 2 },
  reportPeriod: { fontSize: 11, color: TEXT_FAINT },
});
