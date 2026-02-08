import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { diaryApi } from '../api/client';
import { Diary, DiaryStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<DiaryStackParamList, 'DiaryListHome'>;
};

interface DiarySection {
  title: string;
  diaryDate: string;
  data: Diary[];
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const formatDateKorean = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAYS[date.getDay()];
  return `${month}월 ${day}일 ${weekday}요일`;
};

const formatDateISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSameDate = (date1: string, date2: string): boolean => {
  return date1.split('T')[0] === date2.split('T')[0];
};

export default function DiaryListScreen({ navigation }: Props) {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [calendarDates, setCalendarDates] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFullCalendar, setShowFullCalendar] = useState(false);

  const loadDiaries = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const [diaryData, calendarData] = await Promise.all([
        diaryApi.getListByMonth(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1),
        diaryApi.getCalendar(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1),
      ]);
      setDiaries(diaryData);
      setCalendarDates(calendarData.datesWithDiaries);
    } catch (error) {
      console.error('Failed to load diaries:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedMonth]);

  useFocusEffect(
    useCallback(() => {
      loadDiaries();
    }, [loadDiaries])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDiaries(false);
  };

  const handlePrevMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    const next = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
    if (next <= new Date()) {
      setSelectedMonth(next);
    }
  };

  const handleToday = () => {
    setSelectedMonth(new Date());
  };

  // 날짜별로 그룹화
  const sections: DiarySection[] = useMemo(() => {
    const grouped = new Map<string, Diary[]>();

    diaries.forEach(diary => {
      const dateKey = diary.diaryDate;
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(diary);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, items]) => ({
        title: formatDateKorean(date),
        diaryDate: date,
        data: items,
      }));
  }, [diaries]);

  // 캘린더 생성
  const calendarWeeks = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];

    // 첫 주 빈칸 채우기
    for (let i = 0; i < firstDay.getDay(); i++) {
      currentWeek.push(null);
    }

    // 날짜 채우기
    for (let day = 1; day <= lastDay.getDate(); day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // 마지막 주 빈칸 채우기
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(null);
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [selectedMonth]);

  const today = new Date();
  const todayStr = formatDateISO(today);
  const isCurrentMonth = selectedMonth.getMonth() === today.getMonth()
    && selectedMonth.getFullYear() === today.getFullYear();

  const renderCalendarDay = (day: number | null, weekIndex: number, dayIndex: number) => {
    if (day === null) {
      return <View key={`${weekIndex}-${dayIndex}`} style={styles.calendarDay} />;
    }

    const dateStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasDiary = calendarDates.includes(dateStr);
    const isToday = dateStr === todayStr;
    const isFuture = new Date(dateStr) > today;

    return (
      <View key={`${weekIndex}-${dayIndex}`} style={styles.calendarDay}>
        <View style={[
          styles.calendarDayInner,
          isToday && styles.calendarDayToday,
        ]}>
          <Text style={[
            styles.calendarDayText,
            isToday && styles.calendarDayTodayText,
            isFuture && styles.calendarDayFutureText,
            dayIndex === 0 && styles.calendarDaySunday,
            dayIndex === 6 && styles.calendarDaySaturday,
          ]}>
            {day}
          </Text>
          {hasDiary && <View style={styles.calendarDot} />}
        </View>
      </View>
    );
  };

  const renderDiaryCard = ({ item }: { item: Diary }) => (
    <TouchableOpacity
      style={styles.diaryCard}
      onPress={() => navigation.navigate('DiaryDetail', { diaryId: item.id })}
      activeOpacity={0.7}
    >
      <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.content} numberOfLines={2}>{item.content}</Text>
      {item.aiComment && (
        <View style={styles.aiCommentBadge}>
          <Text style={styles.aiCommentText}>AI 코멘트</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: DiarySection }) => {
    const isToday = section.diaryDate === todayStr;
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        {isToday && <Text style={styles.todayBadge}>오늘</Text>}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>📝</Text>
      <Text style={styles.emptyTitle}>
        {selectedMonth.getMonth() + 1}월에 작성한 일기가 없어요
      </Text>
      <Text style={styles.emptySubtitle}>
        오늘 하루는 어떠셨나요?{'\n'}
        첫 번째 일기를 작성해보세요
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9B7A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>나의 일기</Text>
      </View>

      {/* 캘린더 */}
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <Text style={styles.calendarMonthText}>
            {selectedMonth.getFullYear()}년 {selectedMonth.getMonth() + 1}월
          </Text>
          <View style={styles.calendarControls}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarButton}>
              <Text style={styles.calendarButtonText}>‹</Text>
            </TouchableOpacity>
            {!isCurrentMonth && (
              <TouchableOpacity onPress={handleToday} style={styles.todayButton}>
                <Text style={styles.todayButtonText}>오늘</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.calendarButton}
              disabled={isCurrentMonth}
            >
              <Text style={[
                styles.calendarButtonText,
                isCurrentMonth && styles.calendarButtonDisabled,
              ]}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowFullCalendar(!showFullCalendar)}
              style={styles.expandButton}
            >
              <Text style={styles.expandButtonText}>
                {showFullCalendar ? '접기' : '펼치기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 요일 헤더 */}
        <View style={styles.weekdayHeader}>
          {WEEKDAYS.map((day, index) => (
            <Text
              key={day}
              style={[
                styles.weekdayText,
                index === 0 && styles.calendarDaySunday,
                index === 6 && styles.calendarDaySaturday,
              ]}
            >
              {day}
            </Text>
          ))}
        </View>

        {/* 캘린더 그리드 */}
        {showFullCalendar ? (
          calendarWeeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.calendarWeek}>
              {week.map((day, dayIndex) => renderCalendarDay(day, weekIndex, dayIndex))}
            </View>
          ))
        ) : (
          // 현재 주만 표시
          calendarWeeks
            .filter(week => week.some(day => {
              if (day === null) return false;
              const dateStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const weekStart = new Date(dateStr);
              const dayOfWeek = weekStart.getDay();
              const startOfWeek = new Date(weekStart);
              startOfWeek.setDate(weekStart.getDate() - dayOfWeek);
              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(startOfWeek.getDate() + 6);
              return today >= startOfWeek && today <= endOfWeek;
            }))
            .slice(0, 1)
            .map((week, weekIndex) => (
              <View key={weekIndex} style={styles.calendarWeek}>
                {week.map((day, dayIndex) => renderCalendarDay(day, weekIndex, dayIndex))}
              </View>
            ))
        )}
      </View>

      {/* 일기 목록 */}
      <SectionList
        sections={sections}
        renderItem={renderDiaryCard}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContent,
          sections.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyState}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FF9B7A"
          />
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('WriteDiary')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  calendarControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarButtonText: {
    fontSize: 24,
    color: '#666',
  },
  calendarButtonDisabled: {
    color: '#DDD',
  },
  todayButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFF0EB',
    borderRadius: 12,
  },
  todayButtonText: {
    fontSize: 12,
    color: '#FF9B7A',
    fontWeight: '500',
  },
  expandButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginLeft: 4,
  },
  expandButtonText: {
    fontSize: 12,
    color: '#666',
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  calendarWeek: {
    flexDirection: 'row',
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  calendarDayInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  calendarDayToday: {
    backgroundColor: '#FF9B7A',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#2D2D2D',
  },
  calendarDayTodayText: {
    color: '#fff',
    fontWeight: '600',
  },
  calendarDayFutureText: {
    color: '#DDD',
  },
  calendarDaySunday: {
    color: '#FF6B6B',
  },
  calendarDaySaturday: {
    color: '#4A90D9',
  },
  calendarDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF9B7A',
    position: 'absolute',
    bottom: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  todayBadge: {
    fontSize: 11,
    color: '#FF9B7A',
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  diaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  aiCommentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  aiCommentText: {
    fontSize: 12,
    color: '#FF9B7A',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF9B7A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF9B7A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2,
  },
});
