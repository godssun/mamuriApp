/**
 * AICommentScreen v3 — Warm paper AI conversation
 *
 * "AI가 남긴 기록 조각을 조용히 다시 읽는 공간"
 * Paper-textured background, warm companion header,
 * ivory suggestion chips, sage accents.
 *
 * v3 design system tokens. Connected to Diary Detail flow.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  Animated, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  colors, fontFamily, shadows, spacing, borderRadius, layout, duration,
} from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import { conversationApi, companionApi, ApiError } from '../api/client';
import { ConversationMessage, ConversationLimits, DiaryStackParamList } from '../types';
import { formatTime } from '../utils/dateFormat';
import { ChatBubble } from './components/ChatBubble';
import { ReportModal } from './components/ReportModal';

type Props = NativeStackScreenProps<DiaryStackParamList, 'AIComment'>;

export function AICommentScreenV2({ navigation, route }: Props) {
  const { diaryId } = route.params;
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const suggestions = [t('ai.suggestion1'), t('ai.suggestion2'), t('ai.suggestion3'), t('ai.suggestion4')];

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [limits, setLimits] = useState<ConversationLimits | null>(null);
  const [companionName, setCompanionName] = useState(t('auth.appName'));
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [reportMessageId, setReportMessageId] = useState<number | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const suggestionsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(headerAnim, { toValue: 1, duration: duration.slow, useNativeDriver: true }),
      Animated.timing(suggestionsAnim, { toValue: 1, duration: duration.slow, useNativeDriver: true }),
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
    } finally { setLoading(false); }
  }, [diaryId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text || inputText).trim();
    if (!messageText) return;
    setInputText('');
    setIsTyping(true);

    const optimisticId = Date.now();
    const optimisticMsg: ConversationMessage = {
      id: optimisticId, role: 'USER', content: messageText, createdAt: new Date().toISOString(),
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
        setLimits({ ...limits, remainingReplies: reply.remainingReplies, usedRepliesToday: limits.usedRepliesToday + 1 });
      }
    } catch (error: any) {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      if (error instanceof ApiError && (error.status === 403 || error.status === 402)) {
        // 대화 한도 초과(403)/체험 만료(402) → 한도 반영 후 Paywall로 유도
        setLimits(prev => (prev ? { ...prev, remainingReplies: 0 } : prev));
        navigation.navigate('Paywall' as any);
      } else if (error instanceof ApiError && error.status === 429) {
        // 순간 요청 과다(레이트리밋) — 일시적이므로 잠시 후 재시도 안내
        Alert.alert(t('diary.sendFailed'), t('common.retryLater'));
      } else {
        Alert.alert(t('diary.sendFailed'), error?.message || t('common.retry'));
      }
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [inputText, diaryId, limits]);

  if (loading) {
    return (
      <PaperBackground variant="plain" color="cream">
        <View style={[s.center, { paddingTop: insets.top }]}>
          <ActivityIndicator color={colors.accentPrimary} />
        </View>
      </PaperBackground>
    );
  }

  return (
    <PaperBackground variant="plain" color="cream">
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header — warm companion header */}
        <Animated.View style={[s.header, { paddingTop: insets.top + spacing.sm, opacity: headerAnim }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>

          <View style={s.companionInfo}>
            <View style={s.companionAvatar}>
              <View style={s.companionDot} />
            </View>
            <View style={s.companionTextWrap}>
              <Text style={s.companionName}>{companionName}</Text>
              <View style={s.onlineRow}>
                <View style={s.onlineDot} />
                <Text style={s.onlineText}>{t('ai.alwaysHere')}</Text>
              </View>
            </View>
          </View>

          <View style={{ width: 44 }} />
        </Animated.View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={s.flex}
          contentContainerStyle={s.messageContainer}
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
              messageId={msg.role === 'AI' ? msg.id : undefined}
              onReport={msg.role === 'AI' ? setReportMessageId : undefined}
            />
          ))}
          {isTyping && <ChatBubble message="" sender="ai" isTyping animated />}
        </ScrollView>

        {/* Suggestions — ivory chips */}
        {!isTyping && messages.length < 5 && (
          <Animated.View style={[s.suggestionsWrap, { opacity: suggestionsAnim }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.suggestionsRow}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSend(suggestion)}
                  style={s.suggestionChip}
                  activeOpacity={0.7}
                >
                  <Text style={s.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Input — warm paper tone */}
        <View style={[s.inputBar, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={s.inputRow}>
            <TextInput
              style={s.messageInput}
              placeholder={t('ai.messagePlaceholder')}
              placeholderTextColor={colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isTyping}
              style={[
                s.sendBtn,
                (inputText.trim() && !isTyping) ? s.sendBtnActive : s.sendBtnInactive,
              ]}
            >
              <Text style={[s.sendIcon, {
                color: (inputText.trim() && !isTyping) ? colors.surfacePure : colors.textTertiary,
              }]}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ReportModal
          visible={reportMessageId !== null}
          onClose={() => setReportMessageId(null)}
          messageId={reportMessageId ?? 0}
          diaryId={diaryId}
        />
      </KeyboardAvoidingView>
    </PaperBackground>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.accentSand + '30',
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontFamily: fontFamily.sansLight, fontSize: 22, color: colors.textPrimary },

  companionInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  companionAvatar: {
    width: 40, height: 40,
    borderTopLeftRadius: 14, borderTopRightRadius: 18,
    borderBottomRightRadius: 16, borderBottomLeftRadius: 20,
    backgroundColor: colors.accentPrimaryLight + '40',
    borderWidth: 1.5, borderColor: colors.accentPrimaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  companionDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.accentPrimary },
  companionTextWrap: { gap: 2 },
  companionName: { fontFamily: fontFamily.sansMedium, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accentPrimary },
  onlineText: { fontFamily: fontFamily.sans, fontSize: 10, color: colors.accentPrimary },

  // Messages
  messageContainer: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.xl, paddingBottom: spacing.xl,
  },

  // Suggestions
  suggestionsWrap: { paddingVertical: spacing.sm, paddingHorizontal: layout.screenPaddingH },
  suggestionsRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.xl },
  suggestionChip: {
    backgroundColor: colors.bgIvory,
    borderWidth: 1, borderColor: colors.accentSand + '40',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  suggestionText: { fontFamily: fontFamily.sans, fontSize: 13, color: colors.textSecondary },

  // Input bar
  inputBar: {
    paddingTop: spacing.md, paddingHorizontal: layout.screenPaddingH,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.accentSand + '20',
    backgroundColor: colors.glassWhite,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: colors.bgIvory, borderRadius: borderRadius['2xl'],
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    minHeight: 44, borderWidth: 1, borderColor: colors.accentSand + '20',
  },
  messageInput: {
    flex: 1, maxHeight: 100, paddingVertical: 4,
    fontFamily: fontFamily.sans, fontSize: 15, color: colors.textPrimary,
  },
  sendBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm,
  },
  sendBtnActive: { backgroundColor: colors.accentPrimary },
  sendBtnInactive: { backgroundColor: 'transparent' },
  sendIcon: { fontSize: 16 },
});
