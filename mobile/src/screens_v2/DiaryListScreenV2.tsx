/**
 * DiaryListScreen v3 — Scrapbook diary collection
 *
 * "기록 조각들이 모여 있는 느낌"
 * Paper-textured background with ivory diary cards,
 * serif headers, emotion blob chips, and handwritten dates.
 *
 * v3 design system tokens. No react-native-svg dependency.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Animated, RefreshControl,
  ActivityIndicator, TouchableOpacity, Image, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  colors, fontFamily, shadows, spacing, borderRadius, layout,
} from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import i18n from '../i18n/i18n';
import { diaryApi, diaryApiV3, companionApi } from '../api/client';
import { DiaryV3, StreakResponse, DiaryStackParamListV3, EmotionKey } from '../types';
import { formatDiaryDate } from '../utils/dateFormat';
import { DateStrip } from './components/DateStrip';
import { EmotionStickerView } from './components/EmotionStickerView';
import { EMOTION_COLORS, EMOTION_LABELS } from '../constants/stickers';

type Props = NativeStackScreenProps<DiaryStackParamListV3, 'DiaryListHome'>;

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return i18n.t('diary.greetingDawn');
  if (hour < 12) return i18n.t('diary.greetingMorning');
  if (hour < 18) return i18n.t('diary.greetingAfternoon');
  return i18n.t('diary.greetingEvening');
}

// Blob shapes for emotion chips
const chipBlobRadii = [
  { borderTopLeftRadius: 10, borderTopRightRadius: 14, borderBottomRightRadius: 12, borderBottomLeftRadius: 14 },
  { borderTopLeftRadius: 14, borderTopRightRadius: 10, borderBottomRightRadius: 14, borderBottomLeftRadius: 12 },
  { borderTopLeftRadius: 12, borderTopRightRadius: 14, borderBottomRightRadius: 10, borderBottomLeftRadius: 14 },
];

export function DiaryListScreenV2({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const headerAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

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
    Animated.stagger(150, [
      Animated.spring(headerAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(listAnim, { toValue: 1, tension: 40, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

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
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      fetchDiaries();
      fetchCalendar(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
    }, [fetchDiaries, fetchCalendar, selectedDate]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDiaries();
    fetchCalendar(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
  }, [fetchDiaries, fetchCalendar, selectedDate]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    Animated.sequence([
      Animated.timing(listAnim, { toValue: 0.3, duration: 100, useNativeDriver: true }),
      Animated.spring(listAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [listAnim]);

  const handleMonthChange = useCallback((year: number, month: number) => {
    fetchCalendar(year, month);
  }, [fetchCalendar]);

  const renderDiaryItem = ({ item, index }: { item: DiaryV3; index: number }) => {
    const emotionCode = (
      item.emotion?.primarySticker?.category?.code
      || item.emotion?.primarySticker?.code?.replace(/_default$/, '')?.toUpperCase()
      || (item as any).primaryEmotion
    ) as EmotionKey | undefined;
    const emotionColor = emotionCode ? EMOTION_COLORS[emotionCode] : null;

    const firstPhoto = item.photos && item.photos.length > 0 ? item.photos[0] : null;
    const photoUrl = firstPhoto
      ? (firstPhoto.cdnUrl || (firstPhoto as any).url || '').startsWith('http')
        ? (firstPhoto.cdnUrl || (firstPhoto as any).url || '')
        : `${__DEV__ ? `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:8080` : 'https://api.mamuri.app'}${firstPhoto.cdnUrl || (firstPhoto as any).url || ''}`
      : null;

    return (
      <Animated.View style={{
        opacity: listAnim,
        transform: [{
          translateY: listAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [16 + index * 8, 0],
          }),
        }],
        marginBottom: spacing.md,
      }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('DiaryDetail', { diaryId: item.id })}
          activeOpacity={0.7}
          style={[
            styles.diaryCard,
            emotionColor ? { borderLeftWidth: 3, borderLeftColor: emotionColor + '60' } : {},
          ]}
        >
          <View style={styles.cardInner}>
            {/* Photo thumbnail */}
            {photoUrl && (
              <View style={styles.thumbnailWrap}>
                <Image source={{ uri: photoUrl }} style={styles.thumbnail} resizeMode="cover" />
                {/* Vintage overlay */}
                <View style={styles.thumbnailOverlay} />
              </View>
            )}

            {/* Content */}
            <View style={styles.cardContent}>
              {/* Top: Emotion chip + Date */}
              <View style={styles.cardTopRow}>
                {emotionCode && (
                  <View style={[
                    styles.emotionChip,
                    chipBlobRadii[index % chipBlobRadii.length],
                    { backgroundColor: (emotionColor || colors.accentSand) + '15' },
                  ]}>
                    <EmotionStickerView emotionKey={emotionCode} size="mini" />
                    <Text style={[styles.emotionLabel, { color: emotionColor || colors.accentPrimary }]}>
                      {EMOTION_LABELS[emotionCode]}
                    </Text>
                  </View>
                )}
                <Text style={styles.cardDate}>
                  {formatDiaryDate(item.diaryDate)}
                </Text>
              </View>

              {/* Title */}
              <Text numberOfLines={1} style={styles.cardTitle}>
                {item.title}
              </Text>

              {/* Preview */}
              <Text numberOfLines={2} style={styles.cardPreview}>
                {item.content.substring(0, 100)}
              </Text>

              {/* AI badge */}
              {item.aiComment !== null && (
                <View style={styles.aiBadge}>
                  <View style={styles.aiDot} />
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.accentPrimary} />
        </View>
      );
    }

    const isToday = formatDateKey(selectedDate) === formatDateKey(new Date());

    return (
      <Animated.View style={[
        styles.emptyState,
        {
          opacity: listAnim,
          transform: [{
            translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
          }],
        },
      ]}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyDot}>·</Text>
        </View>
        <Text style={styles.emptyTitle}>
          {isToday ? t('diary.emptyToday') : t('diary.emptyOther')}
        </Text>
        <Text style={styles.emptyDesc}>
          {isToday ? t('diary.emptyTodayDesc') : t('diary.emptyOtherDesc')}
        </Text>

        {isToday && (
          <TouchableOpacity
            style={styles.writeBtn}
            onPress={() => navigation.navigate('WriteDiary', {})}
            activeOpacity={0.8}
          >
            <Text style={styles.writeBtnText}>{t('diary.writeToday')}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  return (
    <PaperBackground variant="plain" color="cream">
      {/* Sticky Header */}
      <View style={[styles.stickyHeader, { paddingTop: insets.top + spacing.sm }]}>
        <Animated.View style={[
          styles.greetingRow,
          {
            opacity: headerAnim,
            transform: [{
              translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
            }],
          },
        ]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>{t('diary.myDiary')}</Text>
            <Text style={styles.greeting}>{getGreeting()}</Text>
          </View>

          {streak && streak.currentStreak > 0 && (
            <View style={styles.streakBadge}>
              <View style={styles.streakDot} />
              <Text style={styles.streakText}>
                {t('diary.streakDays', { count: streak.currentStreak })}
              </Text>
            </View>
          )}
        </Animated.View>

        <DateStrip
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          datesWithDiaries={datesWithDiaries}
          onMonthChange={handleMonthChange}
        />
      </View>

      {/* Diary list */}
      <FlatList
        data={diaries}
        renderItem={renderDiaryItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingHorizontal: layout.screenPaddingH,
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + 100,
          flexGrow: diaries.length === 0 ? 1 : undefined,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accentPrimary}
          />
        }
      />
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  // Header
  stickyHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.accentSand + '40',
  },
  greetingRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 4,
  },
  pageTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 24, fontWeight: '500',
    color: colors.textPrimary,
  },
  greeting: {
    fontFamily: fontFamily.sans,
    fontSize: 13, color: colors.textSecondary,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.accentMustard + '18',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: borderRadius.full, gap: 4,
  },
  streakDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.accentMustard,
  },
  streakText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 12, color: colors.accentMustard, fontWeight: '600',
  },

  // Diary card — paper note feel
  diaryCard: {
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
    ...shadows.crisp,
  },
  cardInner: {
    flexDirection: 'row',
  },
  thumbnailWrap: {
    width: 80, position: 'relative',
  },
  thumbnail: {
    width: 80, height: '100%', minHeight: 100,
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(180, 150, 120, 0.06)',
  },
  cardContent: {
    flex: 1, padding: spacing.lg,
  },
  cardTopRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  emotionChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3, gap: 4,
  },
  emotionLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 11, fontWeight: '600',
  },
  cardDate: {
    fontFamily: fontFamily.script,
    fontSize: 12, color: colors.textTertiary,
  },
  cardTitle: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 15, fontWeight: '600',
    color: colors.textPrimary, marginTop: spacing.sm,
  },
  cardPreview: {
    fontFamily: fontFamily.sans,
    fontSize: 13, lineHeight: 19,
    color: colors.textSecondary, marginTop: spacing.xs,
  },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accentPrimaryLight + '30',
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: borderRadius.full, gap: 4,
    marginTop: spacing.sm,
  },
  aiDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.accentPrimary,
  },
  aiBadgeText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 10, color: colors.accentPrimary,
  },

  // Empty state
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingBottom: 60,
  },
  emptyIcon: {
    width: 72, height: 72,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.accentSand + '20',
    borderRadius: borderRadius.xl,
  },
  emptyDot: { fontSize: 32, color: colors.textTertiary },
  emptyTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 18, color: colors.textPrimary,
    marginTop: spacing.xl,
  },
  emptyDesc: {
    fontFamily: fontFamily.sans,
    fontSize: 13, lineHeight: 20,
    color: colors.textSecondary, marginTop: spacing.sm,
    textAlign: 'center',
  },
  writeBtn: {
    borderWidth: 1, borderColor: colors.accentPrimary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 24, paddingVertical: 12,
    marginTop: spacing.lg,
  },
  writeBtnText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 14, color: colors.accentPrimary, fontWeight: '600',
  },
});
