import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  content: string;
  createdAt?: string;
}

export default function UserBubble({ content, createdAt }: Props) {
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
    alignSelf: 'flex-end',
    maxWidth: '85%',
    marginBottom: 12,
  },
  bubble: {
    backgroundColor: '#FF9B7A',
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 14,
  },
  content: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 24,
  },
  time: {
    fontSize: 11,
    color: '#BBB',
    marginTop: 4,
    alignSelf: 'flex-end',
    marginRight: 4,
  },
});
