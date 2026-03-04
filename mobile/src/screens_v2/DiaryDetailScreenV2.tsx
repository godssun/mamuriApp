/**
 * DiaryDetailScreen v2 — Premium AI Companion Style
 *
 * Design: Immersive reading experience with conversation
 * - Full diary content
 * - AI companion response section
 * - Conversation continuation
 * - Subtle transitions
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useThemeV2 } from '../design-system-v2';
import { diaryApi, conversationApi, ApiError } from '../api/client';
import { Diary, ConversationMessage, ConversationLimits, DiaryStackParamList } from '../types';
import { formatDiaryDate, formatTime } from '../utils/dateFormat';
import { Card } from './components/Card';
import { ChatBubble } from './components/ChatBubble';

type Props = NativeStackScreenProps<DiaryStackParamList, 'DiaryDetail'>;

export function DiaryDetailScreenV2({ navigation, route }: Props) {
  const { diaryId } = route.params;
  const { theme } = useThemeV2();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [diary, setDiary] = useState<Diary | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [limits, setLimits] = useState<ConversationLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);

  const contentAnim = useRef(new Animated.Value(0)).current;
  const conversationAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const fetchData = useCallback(async () => {
    try {
      const [diaryData, convData] = await Promise.all([
        diaryApi.getDetail(diaryId),
        conversationApi.getConversation(diaryId),
      ]);
      setDiary(diaryData);
      setMessages(convData.messages);
      setLimits(convData.limits);
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || t('error.dataLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [diaryId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  useEffect(() => {
    if (!loading && diary) {
      Animated.stagger(200, [
        Animated.spring(contentAnim, {
          toValue: 1,
          ...theme.springs.gentle,
          useNativeDriver: true,
        }),
        Animated.spring(conversationAnim, {
          toValue: 1,
          ...theme.springs.soft,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, diary]);

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    // 쿼터 체크
    if (limits && limits.remainingReplies !== null && limits.remainingReplies <= 0) {
      navigation.dispatch(CommonActions.navigate({ name: 'Paywall' }));
      return;
    }

    setInputText('');
    setIsAITyping(true);

    // 유저 메시지 즉시 표시 (optimistic)
    const optimisticUserMsg: ConversationMessage = {
      id: Date.now(),
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticUserMsg]);

    try {
      const reply = await conversationApi.sendReply(diaryId, text);
      // optimistic 유저 메시지를 실제 ID로 교체하고 AI 응답 추가
      setMessages(prev => {
        const withoutOptimistic = prev.filter(m => m.id !== optimisticUserMsg.id);
        return [
          ...withoutOptimistic,
          { id: reply.userMessageId, role: 'USER', content: text, createdAt: reply.createdAt },
          { id: reply.aiMessageId, role: 'AI', content: reply.aiResponse, createdAt: reply.createdAt },
        ];
      });
      // 쿼터 업데이트
      if (limits) {
        setLimits({
          ...limits,
          remainingReplies: reply.remainingReplies,
          usedRepliesToday: limits.usedRepliesToday + 1,
        });
      }
    } catch (error: any) {
      // 실패 시 optimistic 메시지 제거
      setMessages(prev => prev.filter(m => m.id !== optimisticUserMsg.id));
      if (error instanceof ApiError && error.status === 429) {
        navigation.dispatch(CommonActions.navigate({ name: 'Paywall' }));
      } else {
        Alert.alert(t('diary.sendFailed'), error?.message || t('common.retry'));
      }
    } finally {
      setIsAITyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleDeleteConfirm = useCallback(() => {
    Alert.alert(
      t('diary.deleteDiary'),
      t('diary.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await diaryApi.delete(diaryId);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert(t('diary.deleteFailed'), error?.message || t('common.retry'));
            }
          },
        },
      ],
    );
  }, [diaryId, navigation]);

  const handleMorePress = useCallback(() => {
    Alert.alert('', '', [
      {
        text: t('diary.editAction'),
        onPress: () => navigation.navigate('WriteDiary', { editDiaryId: diaryId }),
      },
      {
        text: t('diary.deleteAction'),
        style: 'destructive',
        onPress: handleDeleteConfirm,
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }, [diaryId, navigation, handleDeleteConfirm]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, {
          paddingTop: insets.top,
          paddingHorizontal: theme.layout.screenPaddingH,
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.borderSubtle,
        }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[theme.typography.titleLarge, { color: theme.colors.textPrimary }]}>←</Text>
          </TouchableOpacity>
          <Text style={[theme.typography.labelMedium, { color: theme.colors.textTertiary }]}> </Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (!diary) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        paddingTop: insets.top,
        paddingHorizontal: theme.layout.screenPaddingH,
        backgroundColor: theme.colors.background,
        borderBottomColor: theme.colors.borderSubtle,
      }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={[theme.typography.titleLarge, { color: theme.colors.textPrimary }]}>
            ←
          </Text>
        </TouchableOpacity>
        <Text style={[theme.typography.labelMedium, { color: theme.colors.textTertiary }]}>
          {formatDiaryDate(diary.diaryDate)}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={handleMorePress}>
          <Text style={[theme.typography.bodyLarge, { color: theme.colors.textTertiary }]}>
            ⋯
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Diary Content */}
        <Animated.View style={[
          { paddingHorizontal: theme.layout.screenPaddingH },
          {
            opacity: contentAnim,
            transform: [{
              translateY: contentAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          },
        ]}>
          {/* Title */}
          <Text style={[
            theme.typography.headlineLarge,
            {
              color: theme.colors.textPrimary,
              marginTop: theme.spacing.xl,
            },
          ]}>
            {diary.title}
          </Text>

          {/* Meta */}
          <Text style={[
            theme.typography.caption,
            {
              color: theme.colors.textTertiary,
              marginTop: theme.spacing.sm,
            },
          ]}>
            {formatTime(diary.createdAt)}
          </Text>

          {/* Content */}
          <Text style={[
            theme.typography.bodyLarge,
            {
              color: theme.colors.textPrimary,
              marginTop: theme.spacing['2xl'],
              lineHeight: 28,
            },
          ]}>
            {diary.content}
          </Text>
        </Animated.View>

        {/* Conversation Section */}
        {messages.length > 0 && (
          <Animated.View style={[
            styles.conversationSection,
            {
              marginTop: theme.spacing['3xl'],
              paddingHorizontal: theme.layout.screenPaddingH,
              opacity: conversationAnim,
              transform: [{
                translateY: conversationAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              }],
            },
          ]}>
            {/* Section divider */}
            <View style={styles.sectionDivider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              <View style={[styles.aiLabel, {
                backgroundColor: theme.colors.primarySubtle,
                borderRadius: theme.borderRadius.full,
              }]}>
                <Text style={styles.aiLabelEmoji}>🌿</Text>
                <Text style={[
                  theme.typography.labelSmall,
                  { color: theme.colors.primary },
                ]}>
                  {t('diary.conversationLabel')}
                </Text>
              </View>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            </View>

            {/* Chat bubbles */}
            <View style={{ marginTop: theme.spacing.xl }}>
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg.content}
                  sender={msg.role === 'AI' ? 'ai' : 'user'}
                  timestamp={formatTime(msg.createdAt)}
                  animated={false}
                />
              ))}
              {isAITyping && (
                <ChatBubble
                  message=""
                  sender="ai"
                  isTyping
                />
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={[styles.inputBar, {
        backgroundColor: theme.colors.backgroundElevated,
        borderTopColor: theme.colors.border,
        paddingBottom: insets.bottom + theme.spacing.sm,
        paddingHorizontal: theme.layout.screenPaddingH,
        ...theme.shadows.md,
      }]}>
        <View style={[styles.inputRow, {
          backgroundColor: theme.colors.surfaceSecondary,
          borderRadius: theme.borderRadius['2xl'],
        }]}>
          <TextInput
            style={[
              theme.typography.bodyMedium,
              styles.messageInput,
              { color: theme.colors.textPrimary },
            ]}
            placeholder={t('diary.continuePlaceholder')}
            placeholderTextColor={theme.colors.textDisabled}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isAITyping}
            style={[styles.sendButton, {
              backgroundColor: inputText.trim() && !isAITyping ? theme.colors.primary : 'transparent',
              borderRadius: theme.borderRadius.full,
            }]}
          >
            <Text style={{
              fontSize: 16,
              color: inputText.trim() && !isAITyping ? '#FFFFFF' : theme.colors.textDisabled,
            }}>
              ↑
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationSection: {},
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  aiLabelEmoji: {
    fontSize: 14,
  },
  inputBar: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
  },
  messageInput: {
    flex: 1,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
