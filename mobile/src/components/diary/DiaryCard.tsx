import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Diary } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

type Props = {
  diary: Diary;
  onPress: (diaryId: number) => void;
};

function DiaryCard({ diary, onPress }: Props) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.card }]}
      onPress={() => onPress(diary.id)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`일기: ${diary.title}`}
    >
      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fontFamily, fontSize: Math.round(18 * theme.fontScale) }]} numberOfLines={1}>{diary.title}</Text>
      <Text style={[styles.content, { fontFamily: theme.fontFamily, fontSize: Math.round(14 * theme.fontScale), lineHeight: Math.round(20 * theme.fontScale) }]} numberOfLines={2}>{diary.content}</Text>
      {diary.aiComment && (
        <View style={styles.aiCommentBadge}>
          <Text style={styles.aiCommentText}>AI 코멘트</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default memo(DiaryCard);

const styles = StyleSheet.create({
  card: {
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
});
