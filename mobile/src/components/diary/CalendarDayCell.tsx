import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  day: number | null;
  dateStr: string;
  hasDiary: boolean;
  isToday: boolean;
  isFuture: boolean;
  isSelected: boolean;
  isSunday: boolean;
  isSaturday: boolean;
  onPress: (dateStr: string) => void;
};

function CalendarDayCell({
  day,
  dateStr,
  hasDiary,
  isToday,
  isFuture,
  isSelected,
  isSunday,
  isSaturday,
  onPress,
}: Props) {
  if (day === null) {
    return <View style={styles.container} />;
  }

  const handlePress = () => {
    if (!isFuture && hasDiary) {
      onPress(dateStr);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={hasDiary && !isFuture ? 0.6 : 1}
      accessibilityRole="button"
      accessibilityLabel={`${day}일${hasDiary ? ', 일기 있음' : ''}${isToday ? ', 오늘' : ''}`}
      accessibilityState={{ selected: isSelected }}
    >
      <View style={[
        styles.inner,
        isToday && styles.today,
        isSelected && !isToday && styles.selected,
      ]}>
        <Text style={[
          styles.dayText,
          isToday && styles.todayText,
          isSelected && !isToday && styles.selectedText,
          isFuture && styles.futureText,
          isSunday && !isToday && !isSelected && styles.sundayText,
          isSaturday && !isToday && !isSelected && styles.saturdayText,
        ]}>
          {day}
        </Text>
        {hasDiary && (
          <View style={[
            styles.dot,
            (isToday || isSelected) && styles.dotActive,
          ]} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default memo(CalendarDayCell);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  inner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  today: {
    backgroundColor: '#FF9B7A',
  },
  selected: {
    backgroundColor: '#FFF0EB',
    borderWidth: 1.5,
    borderColor: '#FF9B7A',
  },
  dayText: {
    fontSize: 14,
    color: '#2D2D2D',
  },
  todayText: {
    color: '#fff',
    fontWeight: '600',
  },
  selectedText: {
    color: '#FF9B7A',
    fontWeight: '600',
  },
  futureText: {
    color: '#DDD',
  },
  sundayText: {
    color: '#FF6B6B',
  },
  saturdayText: {
    color: '#4A90D9',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF9B7A',
    position: 'absolute',
    bottom: 4,
  },
  dotActive: {
    backgroundColor: '#fff',
  },
});
