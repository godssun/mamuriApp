import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

type Props = {
  month: number;
  selectedDate: string | null;
  currentStreak?: number;
};

export default function EmptyState({ month, selectedDate, currentStreak }: Props) {
  const { theme } = useTheme();
  const title = selectedDate
    ? '이 날에는 일기가 없어요'
    : `${month}월에 작성한 일기가 없어요`;

  const subtitle = selectedDate
    ? '다른 날짜를 살펴보거나\n새 일기를 작성해보세요'
    : currentStreak && currentStreak > 0
      ? `${currentStreak}일 연속 기록 중이에요\n오늘도 일기를 작성해보세요`
      : '오늘 하루는 어떠셨나요?\n첫 번째 일기를 작성해보세요';

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fontFamily }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontFamily: theme.fontFamily }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
});
