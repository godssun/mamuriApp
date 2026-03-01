import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { diaryApi, companionApi, conversationApi, ApiError } from '../api/client';
import {
  Diary,
  DiaryStackParamList,
  MainStackParamList,
  ConversationMessage,
  ConversationLimits,
} from '../types';
import ConversationBubble from '../components/conversation/ConversationBubble';
import UserBubble from '../components/conversation/UserBubble';
import TypingIndicator from '../components/conversation/TypingIndicator';
import ReplyCounter from '../components/conversation/ReplyCounter';
import MessageInput from '../components/conversation/MessageInput';
import UpgradePromptCard from '../components/subscription/UpgradePromptCard';
import UpgradeModal from '../components/subscription/UpgradeModal';

type Props = {
  navigation: NativeStackNavigationProp<DiaryStackParamList, 'DiaryDetail'>;
  route: RouteProp<DiaryStackParamList, 'DiaryDetail'>;
};

export default function DiaryDetailScreen({ navigation, route }: Props) {
  const { diaryId } = route.params;
  const parentNav = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const [diary, setDiary] = useState<Diary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [aiName, setAiName] = useState('마음이');

  // 대화 상태
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [limits, setLimits] = useState<ConversationLimits | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [conversationLoaded, setConversationLoaded] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const scrollRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    loadDiary();
    companionApi.getProfile()
      .then((profile) => setAiName(profile.aiName))
      .catch(() => {});
  }, [diaryId]);

  // 일기 로드 후 대화 이력 로드
  useEffect(() => {
    if (diary) {
      loadConversation();
    }
  }, [diary?.id]);

  const loadDiary = async () => {
    try {
      const data = await diaryApi.getDetail(diaryId);
      setDiary(data);
    } catch (error) {
      console.error('Failed to load diary:', error);
      Alert.alert('오류', '일기를 불러올 수 없습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async () => {
    try {
      const data = await conversationApi.getConversation(diaryId);
      setMessages(data.messages);
      setLimits(data.limits);
      setConversationLoaded(true);
    } catch {
      // 대화 기능 비활성화 또는 에러 → 레거시 AI 코멘트만 표시
      setConversationLoaded(false);
    }
  };

  const handleSendReply = useCallback(async (content: string) => {
    setIsSending(true);
    scrollToEnd();

    try {
      const response = await conversationApi.sendReply(diaryId, content);

      // 사용자 메시지 + AI 응답 추가
      const userMsg: ConversationMessage = {
        id: response.userMessageId,
        role: 'USER',
        content,
        createdAt: new Date().toISOString(),
      };
      const aiMsg: ConversationMessage = {
        id: response.aiMessageId,
        role: 'AI',
        content: response.aiResponse,
        createdAt: response.createdAt,
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);

      // 남은 횟수 업데이트
      if (limits) {
        setLimits({
          ...limits,
          usedRepliesToday: limits.usedRepliesToday + 1,
          remainingReplies: response.remainingReplies,
        });
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setShowUpgradeModal(true);
      } else {
        const message = error instanceof ApiError
          ? error.message
          : '답장 전송에 실패했습니다.';
        Alert.alert('전송 실패', message);
      }
    } finally {
      setIsSending(false);
    }
  }, [diaryId, limits]);

  const handleRetryAiComment = async () => {
    setIsRetrying(true);
    try {
      const newComment = await diaryApi.retryAiComment(diaryId);
      setDiary((prev) =>
        prev ? { ...prev, aiComment: newComment } : null
      );
      // 대화 이력도 새로고침
      loadConversation();
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'AI 코멘트 생성에 실패했습니다.';
      Alert.alert('재시도 실패', message);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '일기 삭제',
      '이 일기를 삭제하시겠어요?\n삭제된 일기는 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await diaryApi.delete(diaryId);
              navigation.goBack();
            } catch {
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    try {
      parentNav.navigate('Paywall');
    } catch {
      navigation.getParent()?.navigate('Paywall' as never);
    }
  };

  const scrollToEnd = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatDiaryDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${year}년 ${month}월 ${day}일 ${weekday}요일`;
  };

  const formatCreatedAt = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours < 12 ? '오전' : '오후';
    const hour12 = hours % 12 || 12;
    return `${month}월 ${day}일 ${ampm} ${hour12}:${minutes}`;
  };

  const isLimitReached = limits?.remainingReplies === 0;
  const hasConversation = conversationLoaded && messages.length > 0;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9B7A" />
      </View>
    );
  }

  if (!diary) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 뒤로</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.deleteButton}>삭제</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 일기 본문 */}
          <Text style={styles.diaryDate}>{formatDiaryDate(diary.diaryDate)}</Text>
          <Text style={styles.title}>{diary.title}</Text>
          <Text style={styles.diaryContent}>{diary.content}</Text>
          <Text style={styles.createdAt}>작성: {formatCreatedAt(diary.createdAt)}</Text>

          {/* 대화 영역 */}
          <View style={styles.conversationSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{aiName}와(과)의 대화</Text>
              {!hasConversation && (
                <TouchableOpacity
                  onPress={handleRetryAiComment}
                  disabled={isRetrying}
                  style={styles.retryButton}
                >
                  {isRetrying ? (
                    <ActivityIndicator size="small" color="#FF9B7A" />
                  ) : (
                    <Text style={styles.retryText}>다시 받기</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {hasConversation ? (
              // 대화형 UI
              <View style={styles.messagesContainer}>
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

                {isSending && <TypingIndicator aiName={aiName} />}

                {limits && <ReplyCounter limits={limits} />}

                {isLimitReached && (
                  <UpgradePromptCard onUpgrade={handleUpgrade} />
                )}
              </View>
            ) : diary.aiComment ? (
              // 레거시 AI 코멘트 (대화 기능 비활성화 시)
              <View style={styles.aiCommentCard}>
                <Text style={styles.aiCommentContent}>
                  {diary.aiComment.content}
                </Text>
              </View>
            ) : (
              // AI 코멘트 없음
              <View style={styles.aiCommentCard}>
                <Text style={styles.noCommentText}>
                  아직 AI 코멘트가 없습니다.
                </Text>
                <TouchableOpacity
                  onPress={handleRetryAiComment}
                  disabled={isRetrying}
                  style={styles.getCommentButton}
                >
                  <Text style={styles.getCommentButtonText}>
                    코멘트 받기
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* 답장 입력 (대화 기능 활성화 시만) */}
        {hasConversation && (
          <MessageInput
            onSend={handleSendReply}
            isSending={isSending}
            disabled={isLimitReached}
          />
        )}
      </KeyboardAvoidingView>

      <UpgradeModal
        visible={showUpgradeModal}
        aiName={aiName}
        onUpgrade={handleUpgrade}
        onDismiss={() => setShowUpgradeModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    fontSize: 16,
    color: '#FF9B7A',
  },
  deleteButton: {
    fontSize: 16,
    color: '#FF6B6B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  diaryDate: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 20,
  },
  diaryContent: {
    fontSize: 16,
    color: '#2D2D2D',
    lineHeight: 28,
    marginBottom: 16,
  },
  createdAt: {
    fontSize: 12,
    color: '#999',
    marginBottom: 32,
  },
  conversationSection: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryText: {
    fontSize: 14,
    color: '#FF9B7A',
  },
  messagesContainer: {
    gap: 0,
  },
  aiCommentCard: {
    backgroundColor: '#FFF0EB',
    borderRadius: 16,
    padding: 20,
  },
  aiCommentContent: {
    fontSize: 15,
    color: '#2D2D2D',
    lineHeight: 26,
  },
  noCommentText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  getCommentButton: {
    backgroundColor: '#FF9B7A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  getCommentButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
