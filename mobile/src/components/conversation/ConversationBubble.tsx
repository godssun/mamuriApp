import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  content: string;
  aiName: string;
  createdAt?: string;
}

export default function ConversationBubble({ content, aiName, createdAt }: Props) {
  const { theme } = useTheme();
  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours < 12 ? '오전' : '오후';
    const hour12 = hours % 12 || 12;
    return `${ampm} ${hour12}:${minutes}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.nameRow}>
        <Text style={styles.aiName}>{aiName}</Text>
      </View>
      <View style={styles.bubble}>
        <Text style={[styles.content, { fontFamily: theme.fontFamily, fontSize: Math.round(15 * theme.fontScale), lineHeight: Math.round(24 * theme.fontScale) }]}>{content}</Text>
      </View>
      {createdAt && (
        <Text style={styles.time}>{formatTime(createdAt)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    marginBottom: 12,
  },
  nameRow: {
    marginBottom: 4,
    marginLeft: 4,
  },
  aiName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9B7A',
  },
  bubble: {
    backgroundColor: '#FFF0EB',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
  },
  content: {
    fontSize: 15,
    color: '#2D2D2D',
    lineHeight: 24,
  },
  time: {
    fontSize: 11,
    color: '#BBB',
    marginTop: 4,
    marginLeft: 4,
  },
});
