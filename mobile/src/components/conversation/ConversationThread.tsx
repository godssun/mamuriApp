import React, { useRef, useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ConversationMessage } from '../../types';
import ConversationBubble from './ConversationBubble';
import UserBubble from './UserBubble';
import TypingIndicator from './TypingIndicator';
import ReplyCounter from './ReplyCounter';
import { ConversationLimits } from '../../types';

interface Props {
  messages: ConversationMessage[];
  aiName: string;
  isTyping: boolean;
  limits: ConversationLimits | null;
}

export default function ConversationThread({
  messages,
  aiName,
  isTyping,
  limits,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // 새 메시지가 추가되면 스크롤 아래로
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.length, isTyping]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {messages.map((msg) =>
        msg.role === 'AI' ? (
          <ConversationBubble
            key={msg.id}
            content={msg.content}
            aiName={aiName}
            createdAt={msg.createdAt}
          />
        ) : (
          <UserBubble
            key={msg.id}
            content={msg.content}
            createdAt={msg.createdAt}
          />
        )
      )}

      {isTyping && <TypingIndicator aiName={aiName} />}

      {limits && <ReplyCounter limits={limits} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
});
