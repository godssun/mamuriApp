import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  currentStreak: number;
  longestStreak: number;
};

export default function StreakHeader({ currentStreak, longestStreak }: Props) {
  if (currentStreak === 0 && longestStreak === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.currentStreak}>
        <Text style={styles.fireIcon}>🔥</Text>
        <Text style={styles.streakCount}>{currentStreak}</Text>
        <Text style={styles.streakLabel}>일 연속</Text>
      </View>
      {longestStreak > 0 && (
        <View style={styles.bestStreak}>
          <Text style={styles.bestLabel}>최장 {longestStreak}일</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF0EB',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
  },
  currentStreak: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  streakCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF9B7A',
    marginRight: 4,
  },
  streakLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  bestStreak: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestLabel: {
    fontSize: 12,
    color: '#FF9B7A',
    fontWeight: '600',
  },
});
