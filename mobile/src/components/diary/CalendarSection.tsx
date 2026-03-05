import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import CalendarDayCell from './CalendarDayCell';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

type Props = {
  selectedMonth: Date;
  calendarDates: string[];
  selectedDate: string | null;
  showFullCalendar: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onToggleExpand: () => void;
  onSelectDate: (dateStr: string) => void;
};

const formatDateISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CalendarSection({
  selectedMonth,
  calendarDates,
  selectedDate,
  showFullCalendar,
  onPrevMonth,
  onNextMonth,
  onToday,
  onToggleExpand,
  onSelectDate,
}: Props) {
  const today = new Date();
  const todayStr = formatDateISO(today);
  const isCurrentMonth =
    selectedMonth.getMonth() === today.getMonth() &&
    selectedMonth.getFullYear() === today.getFullYear();

  const calendarWeeks = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(null);
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [selectedMonth]);

  const currentWeekIndex = useMemo(() => {
    const todayDay = today.getDate();
    if (!isCurrentMonth) return 0;
    return calendarWeeks.findIndex(week =>
      week.some(day => day === todayDay)
    );
  }, [calendarWeeks, isCurrentMonth, today]);

  const visibleWeeks = showFullCalendar
    ? calendarWeeks
    : calendarWeeks.slice(
        Math.max(0, currentWeekIndex),
        Math.max(1, currentWeekIndex + 1)
      );

  const makeDateStr = useCallback((day: number) => {
    const m = String(selectedMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${selectedMonth.getFullYear()}-${m}-${d}`;
  }, [selectedMonth]);

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.monthText}>
          {selectedMonth.getFullYear()}년 {selectedMonth.getMonth() + 1}월
        </Text>
        <View style={styles.controls}>
          <TouchableOpacity onPress={onPrevMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          {!isCurrentMonth && (
            <TouchableOpacity onPress={onToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>오늘</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onNextMonth}
            style={styles.navButton}
            disabled={isCurrentMonth}
          >
            <Text style={[
              styles.navButtonText,
              isCurrentMonth && styles.navButtonDisabled,
            ]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onToggleExpand} style={styles.expandButton}>
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
              index === 0 && styles.sundayText,
              index === 6 && styles.saturdayText,
            ]}
          >
            {day}
          </Text>
        ))}
      </View>

      {/* 캘린더 그리드 */}
      {visibleWeeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.week}>
          {week.map((day, dayIndex) => {
            const dateStr = day !== null ? makeDateStr(day) : '';
            return (
              <CalendarDayCell
                key={`${weekIndex}-${dayIndex}`}
                day={day}
                dateStr={dateStr}
                hasDiary={day !== null && calendarDates.includes(dateStr)}
                isToday={dateStr === todayStr}
                isFuture={day !== null && new Date(dateStr) > today}
                isSelected={dateStr === selectedDate}
                isSunday={dayIndex === 0}
                isSaturday={dayIndex === 6}
                onPress={onSelectDate}
              />
            );
          })}
        </View>
      ))}

      {/* 선택된 날짜 표시 */}
      {selectedDate && (
        <TouchableOpacity
          style={styles.selectedDateBadge}
          onPress={() => onSelectDate(selectedDate)}
          activeOpacity={0.7}
        >
          <Text style={styles.selectedDateText}>
            {parseInt(selectedDate.split('-')[2])}일 선택됨
          </Text>
          <Text style={styles.clearText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 24,
    color: '#666',
  },
  navButtonDisabled: {
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
  sundayText: {
    color: '#FF6B6B',
  },
  saturdayText: {
    color: '#4A90D9',
  },
  week: {
    flexDirection: 'row',
  },
  selectedDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    alignSelf: 'center',
    gap: 8,
  },
  selectedDateText: {
    fontSize: 13,
    color: '#FF9B7A',
    fontWeight: '500',
  },
  clearText: {
    fontSize: 12,
    color: '#FF9B7A',
  },
});
