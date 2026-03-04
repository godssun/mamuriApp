/**
 * AICommentScreen v2 — Premium AI Companion Style
 *
 * Design: Full-screen AI companion conversation
 * - Companion avatar with subtle glow
 * - Message history with smooth animations
 * - Smart suggestions
 * - Warm, calming atmosphere
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useThemeV2 } from '../design-system-v2';
import { conversationApi, companionApi, ApiError } from '../api/client';
import { ConversationMessage, ConversationLimits, DiaryStackParamList } from '../types';
import { formatTime } from '../utils/dateFormat';
import { ChatBubble } from './components/ChatBubble';

type Props = NativeStackScreenProps<DiaryStackParamList, 'AIComment'>;

export function AICommentScreenV2({ navigation, route }: Props) {
  const { diaryId } = route.params;
  const { t } = useTranslation();
  const { theme } = useThemeV2();
  const insets = useSafeAreaInsets();

  const suggestions = [
    t('ai.suggestion1'),
    t('ai.suggestion2'),
    t('ai.suggestion3'),
    t('ai.suggestion4'),
  ];

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [limits, setLimits] = useState<ConversationLimits | null>(null);
  const [companionName, setCompanionName] = useState(t('auth.appName'));
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const suggestionsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.spring(headerAnim, {
        toValue: 1,
        ...theme.springs.gentle,
        useNativeDriver: true,
      }),
      Animated.spring(suggestionsAnim, {
        toValue: 1,
        ...theme.springs.soft,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [convData, profile] = await Promise.all([
        conversationApi.getConversation(diaryId),
        companionApi.getProfile(),
      ]);
      setMessages(convData.messages);
      setLimits(convData.limits);
      setCompanionName(profile.aiName || t('auth.appName'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || t('error.dataLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [diaryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text || inputText).trim();
    if (!messageText) return;

    // 쿼터 체크
    if (limits && limits.remainingReplies !== null && limits.remainingReplies <= 0) {
      navigation.dispatch(CommonActions.navigate({ name: 'Paywall' }));
      return;
    }

    setInputText('');
    setIsTyping(true);

    // 유저 메시지 optimistic
    const optimisticId = Date.now();
    const optimisticMsg: ConversationMessage = {
      id: optimisticId,
      role: 'USER',
      content: messageText,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const reply = await conversationApi.sendReply(diaryId, messageText);
      setMessages(prev => {
        const withoutOptimistic = prev.filter(m => m.id !== optimisticId);
        return [
          ...withoutOptimistic,
          { id: reply.userMessageId, role: 'USER', content: messageText, createdAt: reply.createdAt },
          { id: reply.aiMessageId, role: 'AI', content: reply.aiResponse, createdAt: reply.createdAt },
        ];
      });
      if (limits) {
        setLimits({
          ...limits,
          remainingReplies: reply.remainingReplies,
          usedRepliesToday: limits.usedRepliesToday + 1,
        });
      }
    } catch (error: any) {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      if (error instanceof ApiError && error.status === 429) {
        navigation.dispatch(CommonActions.navigate({ name: 'Paywall' }));
      } else {
        Alert.alert(t('diary.sendFailed'), error?.message || t('common.retry'));
      }
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [inputText, diaryId, limits, navigation]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Animated.View style={[
        styles.header,
        {
          paddingTop: insets.top + theme.spacing.sm,
          paddingHorizontal: theme.layout.screenPaddingH,
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.borderSubtle,
          opacity: headerAnim,
        },
      ]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Text style={[theme.typography.titleLarge, { color: theme.colors.textPrimary }]}>
            ←
          </Text>
        </TouchableOpacity>

        {/* Companion info */}
        <View style={styles.companionInfo}>
          <View style={[styles.companionAvatar, {
            backgroundColor: theme.colors.primarySubtle,
            borderColor: theme.colors.primaryLight,
          }]}>
            <Text style={{ fontSize: 20 }}>🌿</Text>
          </View>
          <View style={styles.companionText}>
            <Text style={[theme.typography.titleSmall, { color: theme.colors.textPrimary }]}>
              {companionName}
            </Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: theme.colors.success }]} />
              <Text style={[theme.typography.caption, { color: theme.colors.success }]}>
                {t('ai.alwaysHere')}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ width: 44 }} />
      </Animated.View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.screenPaddingH,
          paddingTop: theme.spacing.xl,
          paddingBottom: theme.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg.content}
            sender={msg.role === 'AI' ? 'ai' : 'user'}
            timestamp={formatTime(msg.createdAt)}
            animated={false}
          />
        ))}

        {isTyping && (
          <ChatBubble message="" sender="ai" isTyping animated />
        )}
      </ScrollView>

      {/* Suggestions */}
      {!isTyping && messages.length < 5 && (
        <Animated.View style={[
          styles.suggestionsContainer,
          {
            paddingHorizontal: theme.layout.screenPaddingH,
            opacity: suggestionsAnim,
          },
        ]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsRow}
          >
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSend(suggestion)}
                style={[styles.suggestionChip, {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.full,
                }]}
                activeOpacity={0.7}
              >
                <Text style={[
                  theme.typography.bodySmall,
                  { color: theme.colors.textSecondary },
                ]}>
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Input */}
      <View style={[styles.inputBar, {
        backgroundColor: theme.colors.backgroundElevated,
        borderTopColor: theme.colors.borderSubtle,
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
            placeholder={t('ai.messagePlaceholder')}
            placeholderTextColor={theme.colors.textDisabled}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isTyping}
            style={[styles.sendButton, {
              backgroundColor: inputText.trim() && !isTyping
                ? theme.colors.primary
                : 'transparent',
              borderRadius: theme.borderRadius.full,
            }]}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: inputText.trim() && !isTyping ? '#FFFFFF' : theme.colors.textDisabled,
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
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  companionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  companionText: {
    gap: 2,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  suggestionsContainer: {
    paddingVertical: 8,
  },
  suggestionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
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
