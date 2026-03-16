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

  const isLow = limits.remainingReplies <= 0;
  const isFree = limits.maxRepliesPerDay === 1;

  if (isLow && isFree) {
    return (
      <View style={styles.container}>
        <Text style={styles.blockedText}>
          오늘의 맛보기 답변을 사용했어요
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.text, isLow && styles.lowText]}>
        오늘 남은 답변 {limits.remainingReplies}/{limits.maxRepliesPerDay}
      </Text>
      {isFree && (
        <Text style={styles.hintText}>
          구독하면 더 많은 대화를 나눌 수 있어요
        </Text>
      )}
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
    color: '#FF9B7A',
    fontWeight: '500',
  },
  hintText: {
    fontSize: 11,
    color: '#BBB',
    marginTop: 2,
  },
});
