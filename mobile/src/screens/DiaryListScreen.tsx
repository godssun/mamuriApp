import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { diaryApi } from '../api/client';
import { Diary, DiaryStackParamList } from '../types';
import {
  CalendarSection,
  DiaryCard,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/diary';

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

export default function DiaryListScreen({ navigation }: Props) {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [calendarDates, setCalendarDates] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showFullCalendar, setShowFullCalendar] = useState(true);

  const loadDiaries = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setHasError(false);
    try {
      const [diaryData, calendarData] = await Promise.all([
        diaryApi.getListByMonth(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1),
        diaryApi.getCalendar(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1),
      ]);
      setDiaries(diaryData);
      setCalendarDates(calendarData.datesWithDiaries);
    } catch (error) {
      console.error('Failed to load diaries:', error);
      setHasError(true);
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

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadDiaries(false);
  }, [loadDiaries]);

  const handlePrevMonth = useCallback(() => {
    setSelectedDate(null);
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    const next = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
    if (next <= new Date()) {
      setSelectedDate(null);
      setSelectedMonth(next);
    }
  }, [selectedMonth]);

  const handleToday = useCallback(() => {
    setSelectedDate(null);
    setSelectedMonth(new Date());
  }, []);

  const handleSelectDate = useCallback((dateStr: string) => {
    setSelectedDate(prev => (prev === dateStr ? null : dateStr));
  }, []);

  const handleDiaryPress = useCallback((diaryId: number) => {
    navigation.navigate('DiaryDetail', { diaryId });
  }, [navigation]);

  // 날짜 필터링 적용
  const filteredDiaries = useMemo(() => {
    if (!selectedDate) return diaries;
    return diaries.filter(diary => diary.diaryDate === selectedDate);
  }, [diaries, selectedDate]);

  // 날짜별 그룹화
  const todayStr = formatDateISO(new Date());
  const sections: DiarySection[] = useMemo(() => {
    const grouped = new Map<string, Diary[]>();

    filteredDiaries.forEach(diary => {
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
  }, [filteredDiaries]);

  const renderSectionHeader = useCallback(({ section }: { section: DiarySection }) => {
    const isToday = section.diaryDate === todayStr;
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        {isToday && <Text style={styles.todayBadge}>오늘</Text>}
      </View>
    );
  }, [todayStr]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (hasError) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>나의 일기</Text>
        </View>
        <ErrorState onRetry={() => loadDiaries()} />
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
      <CalendarSection
        selectedMonth={selectedMonth}
        calendarDates={calendarDates}
        selectedDate={selectedDate}
        showFullCalendar={showFullCalendar}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        onToggleExpand={() => setShowFullCalendar(!showFullCalendar)}
        onSelectDate={handleSelectDate}
      />

      {/* 일기 목록 */}
      <SectionList
        sections={sections}
        renderItem={({ item }) => (
          <DiaryCard diary={item} onPress={handleDiaryPress} />
        )}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContent,
          sections.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={
          <EmptyState
            month={selectedMonth.getMonth() + 1}
            selectedDate={selectedDate}
          />
        }
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
        accessibilityRole="button"
        accessibilityLabel="새 일기 작성"
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
