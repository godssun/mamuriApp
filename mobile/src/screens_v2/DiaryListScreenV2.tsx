/**
 * DiaryListScreen v3 — Editorial scrapbook diary collection
 *
 * "기억 페이지를 넘겨보는 스크랩북 리스트"
 *
 * Each diary entry is a curated scrapbook page.
 * Photos in polaroid frames, serif titles, script dates,
 * tape accents, warm paper composition.
 *
 * Date filtering via scrapbook-style date rail:
 * - Serif italic month header with navigation arrows
 * - Horizontal date pill rail with diary-activity dots
 * - All on warm cream paper background
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Animated, RefreshControl,
  ActivityIndicator, TouchableOpacity, Image, Platform, Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  colors, fontFamily, shadows, spacing, borderRadius, layout,
} from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import { diaryApi, diaryApiV3, companionApi } from '../api/client';
import { DiaryV3, StreakResponse, DiaryStackParamListV3, EmotionKey } from '../types';
import { formatDiaryDate } from '../utils/dateFormat';
import { EmotionStickerView } from './components/EmotionStickerView';
import { EMOTION_COLORS, EMOTION_LABELS } from '../constants/stickers';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_W } = Dimensions.get('window');
const CONTENT_W = SCREEN_W - spacing['2xl'] * 2;

type Props = NativeStackScreenProps<DiaryStackParamListV3, 'DiaryListHome'>;

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const count = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= count; d++) days.push(new Date(year, month, d));
  return days;
}

// Polaroid rotation per card index
const polaroidRotations = ['-2deg', '1.5deg', '-1deg', '2deg', '-0.5deg'];
const showTapeFor = [true, false, true, false, true];

export function DiaryListScreenV2({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const listAnim = useRef(new Animated.Value(0)).current;
  const dateScrollRef = useRef<ScrollView>(null);

  const SHORT_WEEKDAYS = t('diaryList.weekdays', { returnObjects: true }) as string[];

  // ── Date state ──
  const filterDate = route.params?.filterDate;
  const initialDate = filterDate ? new Date(filterDate + 'T00:00:00') : new Date();
  const [selectedDate, setSelectedDate] = useState(initialDate);

  useEffect(() => {
    if (filterDate) {
      setSelectedDate(new Date(filterDate + 'T00:00:00'));
      navigation.setParams({ filterDate: undefined } as any);
    }
  }, [filterDate]);

  const [diaries, setDiaries] = useState<DiaryV3[]>([]);
  const [datesWithDiaries, setDatesWithDiaries] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Animated.spring(listAnim, { toValue: 1, tension: 40, friction: 10, useNativeDriver: true }).start();
  }, []);

  // ── Data fetching ──
  const fetchCalendar = useCallback(async (year: number, month: number) => {
    try {
      const calData = await diaryApi.getCalendar(year, month);
      setDatesWithDiaries(new Set(calData.datesWithDiaries));
    } catch {}
  }, []);

  const fetchDiaries = useCallback(async () => {
    try {
      const dateKey = formatDateKey(selectedDate);
      const [diaryData, streakData] = await Promise.all([
        diaryApiV3.getListByDateV3(dateKey),
        companionApi.getStreak(),
      ]);
      setDiaries(diaryData);
      setStreak(streakData);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useFocusEffect(useCallback(() => {
    fetchDiaries();
    fetchCalendar(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
  }, [fetchDiaries, fetchCalendar, selectedDate]));

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDiaries();
    fetchCalendar(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
  }, [fetchDiaries, fetchCalendar, selectedDate]);

  // ── Date selection ──
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setLoading(true);
    Animated.sequence([
      Animated.timing(listAnim, { toValue: 0.3, duration: 80, useNativeDriver: true }),
      Animated.spring(listAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [listAnim]);

  const changeMonth = useCallback((delta: number) => {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + delta, 1);
    const today = new Date();
    if (newDate > new Date(today.getFullYear(), today.getMonth() + 1, 0)) return;
    setSelectedDate(newDate);
    setLoading(true);
    fetchCalendar(newDate.getFullYear(), newDate.getMonth() + 1);
  }, [selectedDate, fetchCalendar]);

  // ── Date rail data ──
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const days = getDaysInMonth(year, month);
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  // Scroll to selected date
  useEffect(() => {
    const CELL_W = 42;
    const dayIndex = selectedDate.getDate() - 1;
    const scrollX = dayIndex * CELL_W - SCREEN_W / 2 + CELL_W / 2 + spacing['2xl'];
    setTimeout(() => {
      dateScrollRef.current?.scrollTo({ x: Math.max(0, scrollX), animated: true });
    }, 150);
  }, [selectedDate.getDate(), month, year]);

  // ── Resolve photo URL ──
  const resolvePhoto = (item: DiaryV3): string | null => {
    const p = item.photos && item.photos.length > 0 ? item.photos[0] : null;
    if (!p) return null;
    const raw = p.cdnUrl || (p as any).url || '';
    if (raw.startsWith('http')) return raw;
    const host = __DEV__ ? `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:8080` : 'https://api.mamuri.app';
    return `${host}${raw}`;
  };

  // ── Render diary entry ──
  const renderDiaryItem = ({ item, index }: { item: DiaryV3; index: number }) => {
    const emotionCode = (
      item.emotion?.primarySticker?.category?.code
      || item.emotion?.primarySticker?.code?.replace(/_default$/, '')?.toUpperCase()
      || (item as any).primaryEmotion
    ) as EmotionKey | undefined;
    const emotionColor = emotionCode ? EMOTION_COLORS[emotionCode] : null;
    const photoUrl = resolvePhoto(item);
    const rotation = polaroidRotations[index % polaroidRotations.length];
    const hasTape = showTapeFor[index % showTapeFor.length];
    const diaryDate = new Date(item.diaryDate);
    const dateLabel = t('date.monthDay', { month: diaryDate.getMonth() + 1, day: diaryDate.getDate() });

    return (
      <Animated.View style={[
        styles.entryContainer,
        {
          opacity: listAnim,
          transform: [{ translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [24 + index * 12, 0] }) }],
        },
      ]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('DiaryDetail', { diaryId: item.id })}
          activeOpacity={0.8}
          style={styles.pageCard}
        >
          {hasTape && <View style={styles.tape} />}

          <Text style={styles.dateScript}>{dateLabel}</Text>

          {photoUrl && (
            <View style={[styles.polaroidWrap, { transform: [{ rotate: rotation }] }]}>
              <View style={styles.polaroidFrame}>
                <Image source={{ uri: photoUrl }} style={styles.polaroidPhoto} resizeMode="cover" />
                <View style={styles.vintageOverlay} />
              </View>
            </View>
          )}

          {emotionCode && (
            <View style={styles.emotionRow}>
              <EmotionStickerView emotionKey={emotionCode} size="small" />
              <Text style={[styles.emotionText, { color: emotionColor || colors.textSecondary }]}>
                {EMOTION_LABELS[emotionCode]}
              </Text>
            </View>
          )}

          <Text numberOfLines={2} style={styles.entryTitle}>{item.title}</Text>
          <Text numberOfLines={3} style={styles.entryPreview}>{item.content.substring(0, 150)}</Text>

          <View style={styles.entryFooter}>
            <Text style={styles.footerDate}>{formatDiaryDate(item.diaryDate)}</Text>
            {item.aiComment !== null && (
              <View style={styles.aiTag}>
                <View style={styles.aiDot} />
                <Text style={styles.aiTagText}>{t('diaryList.aiComment')}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return <View style={styles.emptyState}><ActivityIndicator color={colors.accentPrimary} /></View>;
    }
    const isToday = formatDateKey(selectedDate) === formatDateKey(new Date());
    return (
      <Animated.View style={[styles.emptyState, { opacity: listAnim }]}>
        <View style={styles.emptyPage}>
          <View style={styles.emptyPageLine} />
          <View style={[styles.emptyPageLine, { width: '60%' }]} />
          <View style={[styles.emptyPageLine, { width: '40%' }]} />
        </View>
        <Text style={styles.emptyTitle}>
          {isToday ? t('diaryList.emptyToday') : t('diaryList.emptyOther')}
        </Text>
        <Text style={styles.emptyDesc}>
          {isToday ? t('diaryList.emptyTodayDesc') : t('diaryList.emptyOtherDesc')}
        </Text>
        {isToday && (
          <TouchableOpacity style={styles.writeBtn} onPress={() => navigation.navigate('WriteDiary', {})} activeOpacity={0.8}>
            <Text style={styles.writeBtnText}>{t('diaryList.startPage')}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  return (
    <PaperBackground variant="plain" color="cream">
      {/* ══ Header: title + streak ══ */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.headerTitle}>{t('diaryList.myRecords')}</Text>
        {streak && streak.currentStreak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakNum}>{streak.currentStreak}</Text>
            <Text style={styles.streakLabel}>{t('date.daysSuffix')}</Text>
          </View>
        )}
      </View>

      {/* ══ Scrapbook Date Navigator ══ */}
      <View style={styles.dateNav}>
        {/* Month row */}
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={() => changeMonth(-1)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.monthArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {t('date.yearMonth', { year, month: month + 1 })}
          </Text>
          <TouchableOpacity
            onPress={() => changeMonth(1)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            disabled={isCurrentMonth}
          >
            <Text style={[styles.monthArrow, isCurrentMonth && { opacity: 0.25 }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Date pill rail */}
        <ScrollView
          ref={dateScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateRailContent}
        >
          {days.map((day) => {
            const dateKey = formatDateKey(day);
            const isSelected = formatDateKey(selectedDate) === dateKey;
            const isToday = formatDateKey(today) === dateKey;
            const hasDiary = datesWithDiaries.has(dateKey);
            const isFuture = day > today;
            const isSunday = day.getDay() === 0;

            return (
              <TouchableOpacity
                key={dateKey}
                onPress={() => !isFuture && handleDateSelect(day)}
                disabled={isFuture}
                activeOpacity={0.7}
                style={[
                  styles.datePill,
                  isSelected && styles.datePillSelected,
                ]}
              >
                <Text style={[
                  styles.datePillWeekday,
                  isSunday && { color: colors.accentRose },
                  isSelected && { color: colors.textPrimary },
                  isFuture && { opacity: 0.3 },
                ]}>
                  {SHORT_WEEKDAYS[day.getDay()]}
                </Text>
                <Text style={[
                  styles.datePillNum,
                  isSelected && styles.datePillNumSelected,
                  isToday && !isSelected && { color: colors.accentPrimary },
                  isFuture && { opacity: 0.3 },
                ]}>
                  {day.getDate()}
                </Text>
                {/* Diary activity dot */}
                {hasDiary && !isSelected && (
                  <View style={styles.diaryDot} />
                )}
                {isToday && !isSelected && (
                  <View style={styles.todayDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ══ Diary entries ══ */}
      <FlatList
        data={diaries}
        renderItem={renderDiaryItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingHorizontal: spacing['2xl'],
          paddingTop: spacing.xl,
          paddingBottom: insets.bottom + 120,
          flexGrow: diaries.length === 0 ? 1 : undefined,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accentPrimary} />
        }
      />
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 28, fontWeight: '400',
    color: colors.textPrimary, letterSpacing: -0.5,
  },
  streakBadge: {
    alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.sm,
    ...shadows.crisp,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  streakNum: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 22, color: colors.accentPrimary, fontWeight: '500',
  },
  streakLabel: {
    fontFamily: fontFamily.sans,
    fontSize: 10, color: colors.textTertiary, marginTop: 1,
  },

  // ── Date Navigator — scrapbook style ──
  dateNav: {
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.accentSand + '30',
  },
  monthRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing['3xl'],
    paddingBottom: spacing.md,
  },
  monthTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 17, fontWeight: '400',
    color: colors.textPrimary,
  },
  monthArrow: {
    fontFamily: fontFamily.sansLight,
    fontSize: 24, color: colors.textTertiary,
  },

  // Date pill rail
  dateRailContent: {
    paddingHorizontal: spacing.xl,
    gap: 2,
  },
  datePill: {
    width: 40, height: 56,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: borderRadius.lg,
    gap: 3,
  },
  datePillSelected: {
    backgroundColor: colors.bgIvory,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    ...shadows.crisp,
  },
  datePillWeekday: {
    fontFamily: fontFamily.sans,
    fontSize: 9, color: colors.textTertiary,
    letterSpacing: 0.3,
  },
  datePillNum: {
    fontFamily: fontFamily.sans,
    fontSize: 15, color: colors.textSecondary,
  },
  datePillNumSelected: {
    fontFamily: fontFamily.sansMedium,
    color: colors.textPrimary, fontWeight: '700',
  },
  diaryDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: colors.accentTerra,
    position: 'absolute', bottom: 6,
  },
  todayDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: colors.accentPrimary,
    position: 'absolute', bottom: 6,
  },

  // ── Page Card ──
  entryContainer: { marginBottom: spacing['3xl'] },
  pageCard: {
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.xs,
    padding: spacing['2xl'], paddingTop: spacing['3xl'],
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)',
    ...shadows.soft,
  },
  tape: {
    position: 'absolute', top: -10, alignSelf: 'center',
    left: '50%', marginLeft: -30,
    width: 60, height: 20,
    backgroundColor: colors.glassWhiteLight,
    borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.03)',
    transform: [{ rotate: '1.5deg' }], zIndex: 10,
  },
  dateScript: {
    fontFamily: fontFamily.script,
    fontSize: 20, color: colors.textSecondary,
    marginBottom: spacing.xl, transform: [{ rotate: '-1deg' }],
  },
  polaroidWrap: { alignSelf: 'center', marginBottom: spacing.xl },
  polaroidFrame: {
    backgroundColor: colors.surfacePure,
    padding: 8, paddingBottom: 28,
    width: CONTENT_W - spacing['2xl'] * 2,
    ...shadows.soft,
  },
  polaroidPhoto: { width: '100%', height: 180, borderRadius: 1 },
  vintageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(180, 150, 120, 0.05)',
    margin: 8, marginBottom: 28,
  },
  emotionRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginBottom: spacing.md,
  },
  emotionText: { fontFamily: fontFamily.sansMedium, fontSize: 13, fontWeight: '600' },
  entryTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 22, fontWeight: '400',
    color: colors.textPrimary, lineHeight: 30,
    letterSpacing: -0.3, marginBottom: spacing.md,
  },
  entryPreview: {
    fontFamily: fontFamily.sans,
    fontSize: 14, lineHeight: 22,
    color: colors.textSecondary, marginBottom: spacing.xl,
  },
  entryFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.accentSand + '30', paddingTop: spacing.md,
  },
  footerDate: { fontFamily: fontFamily.sans, fontSize: 11, color: colors.textTertiary },
  aiTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  aiDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accentPrimary },
  aiTagText: { fontFamily: fontFamily.sans, fontSize: 11, color: colors.accentPrimary },

  // ── Empty state ──
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingBottom: 60,
  },
  emptyPage: {
    width: 120, height: 160,
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.xs,
    padding: spacing.xl, justifyContent: 'center', gap: spacing.md,
    ...shadows.crisp,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: spacing['2xl'],
  },
  emptyPageLine: {
    height: 2, backgroundColor: colors.accentSand + '30',
    borderRadius: 1, width: '80%',
  },
  emptyTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 18, color: colors.textPrimary, textAlign: 'center',
  },
  emptyDesc: {
    fontFamily: fontFamily.sans, fontSize: 13, lineHeight: 20,
    color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center',
  },
  writeBtn: {
    borderWidth: 1, borderColor: colors.accentPrimary,
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: 28, paddingVertical: 14,
    marginTop: spacing.xl, backgroundColor: 'rgba(253, 252, 248, 0.5)',
  },
  writeBtnText: {
    fontFamily: fontFamily.serifItalic, fontSize: 15, color: colors.textPrimary,
  },
});
