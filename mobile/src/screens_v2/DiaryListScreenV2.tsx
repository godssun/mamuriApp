/**
 * DiaryListScreen v2 — Premium AI Companion Style
 *
 * Design: Day One / Reflectly inspired diary browsing
 * - Date strip for navigating by day
 * - Animated greeting header with streak
 * - Clean diary cards with mood indicators
 * - Empty state with warm illustration
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Animated,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useThemeV2 } from '../design-system-v2';
import i18n from '../i18n/i18n';
import { diaryApi, companionApi } from '../api/client';
import { Diary, StreakResponse, DiaryStackParamList } from '../types';
import { formatDiaryDate } from '../utils/dateFormat';
import { DiaryCard } from './components/Card';
import { DateStrip } from './components/DateStrip';

type Props = NativeStackScreenProps<DiaryStackParamList, 'DiaryListHome'>;

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

export function DiaryListScreenV2({ navigation }: Props) {
  const { theme, isDark } = useThemeV2();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const headerAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [datesWithDiaries, setDatesWithDiaries] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Animated.stagger(150, [
      Animated.spring(headerAnim, {
        toValue: 1,
        ...theme.springs.gentle,
        useNativeDriver: true,
      }),
      Animated.spring(listAnim, {
        toValue: 1,
        ...theme.springs.soft,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Fetch calendar dots for current month
  const fetchCalendar = useCallback(async (year: number, month: number) => {
    try {
      const calData = await diaryApi.getCalendar(year, month);
      setDatesWithDiaries(new Set(calData.datesWithDiaries));
    } catch {
      // silently fail
    }
  }, []);

  // Fetch diaries for selected date
  const fetchDiaries = useCallback(async () => {
    try {
      const dateKey = formatDateKey(selectedDate);
      const [diaryData, streakData] = await Promise.all([
        diaryApi.getListByDate(dateKey),
        companionApi.getStreak(),
      ]);
      setDiaries(diaryData);
      setStreak(streakData);
    } catch {
      // keep existing data
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
    setLoading(true);
    // Animation for list change
    listAnim.setValue(0);
    Animated.spring(listAnim, {
      toValue: 1,
      ...theme.springs.gentle,
      useNativeDriver: true,
    }).start();
  }, [listAnim, theme]);

  const handleMonthChange = useCallback((year: number, month: number) => {
    fetchCalendar(year, month);
  }, [fetchCalendar]);

  const renderDiaryItem = ({ item, index }: { item: Diary; index: number }) => {
    return (
      <Animated.View style={{
        opacity: listAnim,
        transform: [{
          translateY: listAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [16 + index * 8, 0],
          }),
        }],
      }}>
        <DiaryCard
          date={formatDiaryDate(item.diaryDate)}
          title={item.title}
          preview={item.content.substring(0, 100)}
          moodColor={theme.colors.primary}
          hasAIComment={item.aiComment !== null}
          onPress={() => navigation.navigate('DiaryDetail', { diaryId: item.id })}
          style={{ marginBottom: theme.spacing.md }}
        />
      </Animated.View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color={theme.colors.primary} />
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
            translateY: listAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          }],
        },
      ]}>
        <View style={[styles.emptyIcon, {
          backgroundColor: isDark
            ? 'rgba(148, 136, 255, 0.08)'
            : theme.colors.primarySubtle,
          borderRadius: theme.borderRadius['2xl'],
        }]}>
          <Text style={styles.emptyEmoji}>
            {isToday ? '✍️' : '📖'}
          </Text>
        </View>
        <Text style={[
          theme.typography.titleMedium,
          { color: theme.colors.textPrimary, marginTop: theme.spacing.xl },
        ]}>
          {isToday ? t('diary.emptyToday') : t('diary.emptyOther')}
        </Text>
        <Text style={[
          theme.typography.bodySmall,
          {
            color: theme.colors.textSecondary,
            marginTop: theme.spacing.sm,
            textAlign: 'center',
            lineHeight: 20,
          },
        ]}>
          {isToday
            ? t('diary.emptyTodayDesc')
            : t('diary.emptyOtherDesc')}
        </Text>

        {/* Quick action button — today only */}
        {isToday && (
          <TouchableOpacity
            style={[styles.writeActionButton, {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.borderRadius.full,
              marginTop: theme.spacing.lg,
            }]}
            onPress={() => navigation.navigate('WriteDiary')}
            activeOpacity={0.85}
          >
            <Text style={[
              theme.typography.labelMedium,
              { color: theme.colors.onPrimary, fontWeight: '600' },
            ]}>
              {t('diary.writeToday')}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Sticky Header: Greeting + Date Strip */}
      <View style={[
        styles.stickyHeader,
        {
          paddingTop: insets.top + theme.spacing.sm,
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.borderSubtle,
        },
      ]}>
        {/* Greeting row */}
        <Animated.View style={[
          styles.greetingRow,
          {
            paddingHorizontal: theme.layout.screenPaddingH,
            opacity: headerAnim,
            transform: [{
              translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            }],
          },
        ]}>
          <View style={{ flex: 1 }}>
            <Text style={[
              theme.typography.headlineLarge,
              { color: theme.colors.textPrimary },
            ]}>
              {t('diary.myDiary')}
            </Text>
            <Text style={[
              theme.typography.bodySmall,
              { color: theme.colors.textSecondary, marginTop: theme.spacing.xxs },
            ]}>
              {getGreeting()}
            </Text>
          </View>

          {/* Streak badge */}
          {streak && streak.currentStreak > 0 && (
            <View style={[styles.streakBadge, {
              backgroundColor: isDark
                ? 'rgba(255, 216, 118, 0.12)'
                : theme.colors.accentSubtle,
              borderRadius: theme.borderRadius.full,
            }]}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={[
                theme.typography.labelMedium,
                { color: theme.colors.accent, fontWeight: '700' },
              ]}>
                {t('diary.streakDays', { count: streak.currentStreak })}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Date strip */}
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
          paddingHorizontal: theme.layout.screenPaddingH,
          paddingTop: theme.spacing.lg,
          paddingBottom: insets.bottom + 100,
          flexGrow: diaries.length === 0 ? 1 : undefined,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  streakEmoji: {
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 32,
  },
  writeActionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
});
