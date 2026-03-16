/**
 * Design System v2 — Date Strip Component
 *
 * Horizontal scrollable month view with date cells.
 * Inspired by Apple Fitness rings / Day One / GitHub contributions.
 *
 * Features:
 * - Month/year header with prev/next navigation
 * - Horizontal date cells with diary activity circles
 * - Filled circle for dates with diary entries (warm rose)
 * - Today ring highlight (primary outline, bold)
 * - Sunday red coloring
 * - Selected date solid primary circle
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useThemeV2 } from '../../design-system-v2';
import { getShortWeekday, formatYearMonth } from '../../utils/dateFormat';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface DateStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  datesWithDiaries: Set<string>; // 'YYYY-MM-DD' format
  onMonthChange: (year: number, month: number) => void;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const daysCount = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysCount; d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function DateStrip({
  selectedDate,
  onDateSelect,
  datesWithDiaries,
  onMonthChange,
}: DateStripProps) {
  const { theme, isDark } = useThemeV2();
  const scrollRef = useRef<ScrollView>(null);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const days = getDaysInMonth(year, month);
  const today = new Date();

  const CELL_WIDTH = 44;
  const CELL_GAP = 4;
  const PADDING_H = 16;
  const CIRCLE_SIZE = 30;
  const TODAY_CIRCLE_SIZE = 32;

  // Scroll to selected date on mount/change
  useEffect(() => {
    const dayIndex = selectedDate.getDate() - 1;
    const scrollTo = dayIndex * (CELL_WIDTH + CELL_GAP) - (SCREEN_WIDTH / 2) + (CELL_WIDTH / 2) + PADDING_H;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: Math.max(0, scrollTo), animated: true });
    }, 100);
  }, [selectedDate.getDate(), month, year]);

  const handlePrevMonth = useCallback(() => {
    const prev = new Date(year, month - 1, 1);
    onDateSelect(prev);
    onMonthChange(prev.getFullYear(), prev.getMonth() + 1);
  }, [year, month, onDateSelect, onMonthChange]);

  const handleNextMonth = useCallback(() => {
    const next = new Date(year, month + 1, 1);
    // Don't go beyond current month
    if (next <= new Date(today.getFullYear(), today.getMonth() + 1, 0)) {
      onDateSelect(next);
      onMonthChange(next.getFullYear(), next.getMonth() + 1);
    }
  }, [year, month, onDateSelect, onMonthChange, today]);

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const canGoNext = !isCurrentMonth;

  // Diary activity circle colors
  const diaryCircleBg = isDark
    ? 'rgba(255, 141, 132, 0.16)'
    : 'rgba(240, 112, 106, 0.12)';
  const diaryCircleBgStrong = isDark
    ? 'rgba(255, 141, 132, 0.22)'
    : 'rgba(240, 112, 106, 0.18)';

  return (
    <View style={styles.container}>
      {/* Month header */}
      <View style={[styles.monthHeader, { paddingHorizontal: theme.layout.screenPaddingH }]}>
        <TouchableOpacity
          onPress={handlePrevMonth}
          style={styles.monthArrow}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[
            styles.arrowText,
            { color: theme.colors.textSecondary },
          ]}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={[
          theme.typography.titleMedium,
          { color: theme.colors.textPrimary },
        ]}>
          {formatYearMonth(year, month)}
        </Text>

        <TouchableOpacity
          onPress={handleNextMonth}
          style={styles.monthArrow}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          disabled={!canGoNext}
        >
          <Text style={[
            styles.arrowText,
            { color: canGoNext ? theme.colors.textSecondary : theme.colors.textDisabled },
          ]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date cells scroll */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: PADDING_H },
        ]}
      >
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          const dateKey = formatDateKey(day);
          const hasDiary = datesWithDiaries.has(dateKey);
          const isFuture = day > today;
          const dayLabel = getShortWeekday(day.getDay());
          const isSunday = day.getDay() === 0;

          const circleSize = isToday && !isSelected
            ? TODAY_CIRCLE_SIZE
            : CIRCLE_SIZE;

          // Circle background: selected > diary > transparent
          const circleBg = isSelected
            ? theme.colors.primary
            : hasDiary
              ? isToday ? diaryCircleBgStrong : diaryCircleBg
              : 'transparent';

          // Today ring (when not selected)
          const showRing = isToday && !isSelected;

          return (
            <TouchableOpacity
              key={dateKey}
              onPress={() => !isFuture && onDateSelect(day)}
              disabled={isFuture}
              activeOpacity={0.7}
              style={[
                styles.dateCell,
                { width: CELL_WIDTH, marginRight: CELL_GAP },
              ]}
            >
              {/* Day label (일, 월, 화...) */}
              <Text style={[
                styles.dayLabel,
                {
                  color: isSelected
                    ? theme.colors.primary
                    : isFuture
                      ? theme.colors.textDisabled
                      : isSunday
                        ? theme.colors.secondary
                        : theme.colors.textTertiary,
                  fontWeight: isSunday && !isFuture ? '600' : '500',
                },
              ]}>
                {dayLabel}
              </Text>

              {/* Date circle — the diary activity indicator */}
              <View style={[
                styles.dateCircle,
                {
                  width: circleSize,
                  height: circleSize,
                  borderRadius: circleSize / 2,
                  backgroundColor: circleBg,
                  borderWidth: showRing ? 2 : 0,
                  borderColor: showRing ? theme.colors.primary : 'transparent',
                },
              ]}>
                <Text style={[
                  styles.dateNumber,
                  {
                    color: isSelected
                      ? '#FFFFFF'
                      : isFuture
                        ? theme.colors.textDisabled
                        : isToday
                          ? theme.colors.primary
                          : isSunday
                            ? isDark ? theme.colors.secondary : '#D95A55'
                            : theme.colors.textPrimary,
                    fontWeight: isSelected || isToday ? '700' : hasDiary ? '600' : '400',
                  },
                ]}>
                  {day.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  monthArrow: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  scrollContent: {
    paddingVertical: 4,
  },
  dateCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 4,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  dateCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumber: {
    fontSize: 15,
    lineHeight: 20,
  },
});
