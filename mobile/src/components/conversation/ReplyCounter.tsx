import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ConversationLimits } from '../../types';

interface Props {
  limits: ConversationLimits;
}

export default function ReplyCounter({ limits }: Props) {
  if (limits.remainingReplies === null) {
    return null; // 무제한이면 표시하지 않음
  }

  const isLow = limits.remainingReplies <= 1;
  const isBlocked = limits.maxRepliesPerDay === 0;

  if (isBlocked) {
    return (
      <View style={styles.container}>
        <Text style={styles.blockedText}>
          체험이 만료되었습니다. 구독을 시작해주세요.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.text, isLow && styles.lowText]}>
        오늘 남은 답변 {limits.remainingReplies}/{limits.maxRepliesPerDay}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  text: {
    fontSize: 12,
    color: '#999',
  },
  lowText: {
    color: '#FF6B6B',
    fontWeight: '500',
  },
  blockedText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '500',
  },
});
