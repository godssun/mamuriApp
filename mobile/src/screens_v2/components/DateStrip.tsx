/**
 * Design System v3 — Date Strip Component
 *
 * Horizontal scrollable month view with date cells.
 * Inspired by Apple Fitness rings / Day One / GitHub contributions.
 *
 * Features:
 * - Month/year header with prev/next navigation
 * - Horizontal date cells with diary activity circles
 * - Filled circle for dates with diary entries (warm terra)
 * - Today ring highlight (primary outline, bold)
 * - Sunday rose coloring
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
import { colors, fontFamily, layout } from '../../design-system-v3';
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

// Diary activity circle colors
const diaryCircleBg = colors.accentTerra + '15';
const diaryCircleBgStrong = colors.accentTerra + '22';

export function DateStrip({
  selectedDate,
  onDateSelect,
  datesWithDiaries,
  onMonthChange,
}: DateStripProps) {
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

  return (
    <View style={styles.container}>
      {/* Month header */}
      <View style={[styles.monthHeader, { paddingHorizontal: layout.screenPaddingH }]}>
        <TouchableOpacity
          onPress={handlePrevMonth}
          style={styles.monthArrow}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[
            styles.arrowText,
            { color: colors.textSecondary },
          ]}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={[
          styles.monthTitle,
          { color: colors.textPrimary },
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
            { color: canGoNext ? colors.textSecondary : (colors.textTertiary + '80') },
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
            ? colors.accentPrimary
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
                    ? colors.accentPrimary
                    : isFuture
                      ? (colors.textTertiary + '80')
                      : isSunday
                        ? colors.accentRose
                        : colors.textTertiary,
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
                  borderColor: showRing ? colors.accentPrimary : 'transparent',
                },
              ]}>
                <Text style={[
                  styles.dateNumber,
                  {
                    color: isSelected
                      ? '#FFFFFF'
                      : isFuture
                        ? (colors.textTertiary + '80')
                        : isToday
                          ? colors.accentPrimary
                          : isSunday
                            ? '#D95A55'
                            : colors.textPrimary,
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
  monthTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 16,
    lineHeight: 22,
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
    fontFamily: fontFamily.sans,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  dateCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumber: {
    fontFamily: fontFamily.sans,
    fontSize: 15,
    lineHeight: 20,
  },
});
