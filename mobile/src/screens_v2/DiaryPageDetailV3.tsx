/**
 * DiaryPageDetail V3 — Immersive diary detail with emotion + photos
 *
 * - Emotion sticker header
 * - Photo display (full-width, rounded)
 * - Theme background
 * - Deco sticker overlay (read-only)
 * - AI comment bubble (ChatBubble reuse)
 * - Conversation area (existing logic)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, TextInput, ActivityIndicator, Alert, Image, Dimensions, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemeV2 } from '../design-system-v2';
import type { Theme } from '../design-system-v2';
import { diaryApiV3, diaryApi, conversationApi, ApiError } from '../api/client';
import type { DiaryV3, ConversationMessage, ConversationLimits, DiaryStackParamListV3, EmotionKey } from '../types';
import { formatDiaryDate, formatTime } from '../utils/dateFormat';
import { ChatBubble } from './components/ChatBubble';
import { ReportModal } from './components/ReportModal';
import { EMOTION_COLORS, EMOTION_LABELS } from '../constants/stickers';
import { EmotionStickerView } from './components/EmotionStickerView';
import { DraggableSticker } from './components/DraggableSticker';
import { getStickerSource } from '../constants/stickerSources';

// Photo URL resolver: handles relative paths and localhost URLs
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const SERVER_ORIGIN = __DEV__ ? `http://${DEV_HOST}:8080` : 'https://api.mamuri.app';

function resolvePhotoUrl(photo: { cdnUrl?: string; url?: string }): string {
  const raw = photo.cdnUrl || photo.url || '';
  if (raw.startsWith('http')) return raw;
  return `${SERVER_ORIGIN}${raw}`;
}

type Props = NativeStackScreenProps<DiaryStackParamListV3, 'DiaryDetail'>;

export default function DiaryPageDetailV3({ navigation, route }: Props) {
  const { diaryId } = route.params;
  const { theme } = useThemeV2();
  const insets = useSafeAreaInsets();
  const s = makeStyles(theme);

  const [diary, setDiary] = useState<DiaryV3 | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [limits, setLimits] = useState<ConversationLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [reportMessageId, setReportMessageId] = useState<number | null>(null);
  const [decoCanvasHeight, setDecoCanvasHeight] = useState(0);

  const contentAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const fetchData = useCallback(async () => {
    try {
      const [diaryData, convData] = await Promise.all([
        diaryApiV3.getDetailV3(diaryId),
        conversationApi.getConversation(diaryId),
      ]);
      setDiary(diaryData);
      setMessages(convData.messages);
      setLimits(convData.limits);
    } catch (error: any) {
      Alert.alert('오류', error?.message || '데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [diaryId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  useEffect(() => {
    if (!loading && diary) {
      Animated.spring(contentAnim, {
        toValue: 1, tension: 50, friction: 8, useNativeDriver: true,
      }).start();
    }
  }, [loading, diary]);

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    setIsAITyping(true);

    const optimisticMsg: ConversationMessage = {
      id: Date.now(), role: 'USER', content: text, createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const reply = await conversationApi.sendReply(diaryId, text);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== optimisticMsg.id);
        return [
          ...filtered,
          { id: reply.userMessageId, role: 'USER', content: text, createdAt: reply.createdAt },
          { id: reply.aiMessageId, role: 'AI', content: reply.aiResponse, createdAt: reply.createdAt },
        ];
      });
      if (limits) {
        setLimits({ ...limits, remainingReplies: reply.remainingReplies, usedRepliesToday: limits.usedRepliesToday + 1 });
      }
    } catch (error: any) {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      Alert.alert('전송 실패', error?.message || '잠시 후 다시 시도해주세요.');
    } finally {
      setIsAITyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleMorePress = () => {
    Alert.alert('', '', [
      { text: '수정하기', onPress: () => navigation.navigate('WriteDiary', { editDiaryId: diaryId }) },
      { text: '삭제하기', style: 'destructive', onPress: () => {
        Alert.alert('일기 삭제', '정말 삭제하시겠어요?', [
          { text: '취소', style: 'cancel' },
          { text: '삭제', style: 'destructive', onPress: async () => {
            try { await diaryApi.delete(diaryId); navigation.goBack(); } catch {}
          }},
        ]);
      }},
      { text: '취소', style: 'cancel' },
    ]);
  };

  if (loading) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <View style={{ width: 44 }} />
          <View style={{ width: 44 }} />
        </View>
        <View style={s.loadingCenter}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (!diary) return null;

  // 백엔드 응답 구조에 따라 여러 경로로 감정 코드 추출 (fallback chain)
  const emotionCode = (
    diary.emotion?.primarySticker?.category?.code
    || diary.emotion?.primarySticker?.code?.replace(/_default$/, '')?.toUpperCase()
    || (diary as any).primaryEmotion
    || (diary as any).emotion?.primaryEmotion
  ) as EmotionKey | undefined;
  const emotionColor = emotionCode ? EMOTION_COLORS[emotionCode] : null;
  const diaryTheme = diary.theme;
  const themeColors: Record<string, string> = { night: '#1A1A2E', warm: '#FFF8F0', nature: '#F0F7F0', note: '#FFFDF5', grid: '#F8FBF8' };
  const bgColor = themeColors[diaryTheme || ''] || theme.colors.background;
  const txtColor = diaryTheme === 'night' ? '#EDEDF0' : theme.colors.textPrimary;

  return (
    <View style={[s.root, { backgroundColor: bgColor, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={[s.backText, { color: txtColor }]}>←</Text>
        </TouchableOpacity>
        <Text style={[s.headerDate, { color: diaryTheme === 'night' ? '#9898AC' : theme.colors.textTertiary }]}>
          {formatDiaryDate(diary.diaryDate)}
        </Text>
        <TouchableOpacity style={s.backBtn} onPress={handleMorePress}>
          <Text style={[s.backText, { color: diaryTheme === 'night' ? '#9898AC' : theme.colors.textTertiary }]}>⋯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ Diary Page — stickers overlay the entire content area ═══ */}
        <View
          style={[s.diaryPage, {
            backgroundColor: bgColor,
            paddingHorizontal: theme.layout.screenPaddingH,
          }]}
          onLayout={(e) => setDecoCanvasHeight(e.nativeEvent.layout.height)}
        >
          <Animated.View style={[
            { opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
          ]}>
            {/* Emotion Header */}
            {emotionCode && (
              <View style={[s.emotionHeader, { backgroundColor: (emotionColor || theme.colors.primary) + '15' }]}>
                <EmotionStickerView emotionKey={emotionCode} size="small" />
                <View>
                  <Text style={[s.emotionLabel, { color: emotionColor || theme.colors.primary }]}>
                    {EMOTION_LABELS[emotionCode]}
                  </Text>
                  {diary.emotion?.secondaryTags && diary.emotion.secondaryTags.length > 0 && (
                    <Text style={[s.emotionTags, { color: (emotionColor || theme.colors.primary) + 'AA' }]}>
                      {diary.emotion.secondaryTags.join(' · ')}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Photos */}
            {diary.photos && diary.photos.length > 0 && (
              <View style={s.photoSection}>
                {diary.photos.map((photo) => (
                  <Image
                    key={photo.id}
                    source={{ uri: resolvePhotoUrl(photo) }}
                    style={s.detailPhoto}
                    resizeMode="cover"
                  />
                ))}
              </View>
            )}

            {/* Title */}
            <Text style={[s.title, { color: txtColor }]}>{diary.title}</Text>

            {/* Meta */}
            <Text style={[s.meta, { color: diaryTheme === 'night' ? '#686880' : theme.colors.textTertiary }]}>
              {formatTime(diary.createdAt)}
            </Text>

            {/* Content with lined background */}
            <View style={s.contentArea}>
              {(diaryTheme === 'note' || diaryTheme === 'warm') && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <View key={i} style={{ height: 28, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: diaryTheme === 'note' ? '#E8E0D0' : '#F0E8E0' }} />
                  ))}
                </View>
              )}
              {(diaryTheme === 'grid' || diaryTheme === 'nature') && (
                <View style={[StyleSheet.absoluteFill, { flexDirection: 'column' }]} pointerEvents="none">
                  {Array.from({ length: 40 }).map((_, row) => (
                    <View key={row} style={{ flexDirection: 'row', height: 28 }}>
                      {Array.from({ length: 12 }).map((_, col) => (
                        <View key={col} style={{ flex: 1, borderWidth: StyleSheet.hairlineWidth, borderColor: diaryTheme === 'grid' ? '#D0D8D0' : '#D8E8D8' }} />
                      ))}
                    </View>
                  ))}
                </View>
              )}
              <Text style={[s.content, { color: txtColor }]}>{diary.content}</Text>
            </View>
          </Animated.View>

          {/* Sticker overlays — positioned over the entire diary page */}
          {diary.decorations && diary.decorations.length > 0 && (
            diary.decorations.map((deco) => {
              const code = deco.assetCode || deco.assetType || '';
              const source = getStickerSource(code);
              if (!source) return null;
              const canvasW = Dimensions.get('window').width - (theme.layout.screenPaddingH * 2);
              return (
                <DraggableSticker
                  key={deco.id}
                  id={String(deco.id)}
                  stickerCode={code}
                  stickerSource={source}
                  initialX={deco.positionX * canvasW}
                  initialY={deco.positionY * canvasW}
                  size={Math.round(60 * (deco.scale || 1))}
                  editable={false}
                  onPositionChange={() => {}}
                />
              );
            })
          )}
        </View>

        {/* Conversation */}
        {messages.length > 0 && (
          <View style={[s.conversationSection, { paddingHorizontal: theme.layout.screenPaddingH }]}>
            <View style={s.dividerRow}>
              <View style={[s.dividerLine, { backgroundColor: theme.colors.border }]} />
              <View style={[s.aiLabel, { backgroundColor: theme.colors.primarySubtle }]}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary, marginRight: 6 }} />
                <Text style={[s.aiLabelText, { color: theme.colors.primary }]}>대화</Text>
              </View>
              <View style={[s.dividerLine, { backgroundColor: theme.colors.border }]} />
            </View>

            <View style={{ marginTop: theme.spacing.xl }}>
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
              {isAITyping && <ChatBubble message="" sender="ai" isTyping />}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={[s.inputBar, {
        backgroundColor: bgColor,
        borderTopColor: diaryTheme === 'night' ? '#2A2A3A' : theme.colors.border,
        paddingBottom: insets.bottom + 8,
      }]}>
        <View style={[s.inputRow, {
          backgroundColor: diaryTheme === 'night' ? '#252535' : theme.colors.surfaceSecondary,
        }]}>
          <TextInput
            style={[s.messageInput, { color: txtColor }]}
            placeholder="이야기를 이어가보세요..."
            placeholderTextColor={diaryTheme === 'night' ? '#686880' : theme.colors.textDisabled}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isAITyping}
            style={[s.sendBtn, {
              backgroundColor: inputText.trim() && !isAITyping ? theme.colors.primary : 'transparent',
            }]}
          >
            <Text style={{ fontSize: 16, color: inputText.trim() && !isAITyping ? '#FFFFFF' : theme.colors.textDisabled }}>
              ↑
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ReportModal
        visible={reportMessageId !== null}
        onClose={() => setReportMessageId(null)}
        messageId={reportMessageId ?? 0}
        diaryId={diaryId}
      />
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1 },

    header: {
      height: 56, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', paddingHorizontal: t.layout.screenPaddingH,
      borderBottomWidth: 1, borderBottomColor: t.colors.borderSubtle,
    },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    backText: { ...t.typography.titleLarge },
    headerDate: { ...t.typography.labelMedium },

    loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Emotion header
    emotionHeader: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
      borderRadius: t.borderRadius.lg, marginTop: t.spacing.xl, gap: 10,
    },
    emotionLabel: { fontSize: 16, fontWeight: '700' },
    emotionTags: { fontSize: 12, marginTop: 2 },

    // Photos
    photoSection: { marginTop: t.spacing.xl, gap: t.spacing.md },
    detailPhoto: { width: '100%', height: 240, borderRadius: 16 },

    // Content
    title: { ...t.typography.headlineLarge, marginTop: t.spacing.xl },
    meta: { ...t.typography.caption, marginTop: t.spacing.sm },
    contentArea: { position: 'relative', marginTop: t.spacing.xl, minHeight: 100 },
    content: { ...t.typography.bodyLarge, lineHeight: 28, fontSize: 15, paddingTop: 0 },

    // Deco
    // Diary page container — stickers overlay the whole area
    diaryPage: {
      position: 'relative',
      minHeight: 300,
      overflow: 'visible',
      paddingVertical: t.spacing.xl,
    },

    decoOverlay: { position: 'absolute', bottom: 0, right: 0, opacity: 0.08 },
    decoEmoji: { fontSize: 60 },

    // Conversation
    conversationSection: { marginTop: t.spacing['3xl'] },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dividerLine: { flex: 1, height: 1 },
    aiLabel: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: t.borderRadius.full,
    },
    aiLabelText: { ...t.typography.labelSmall },

    // Input
    inputBar: { paddingTop: 12, paddingHorizontal: t.layout.screenPaddingH, borderTopWidth: 1 },
    inputRow: {
      flexDirection: 'row', alignItems: 'flex-end',
      paddingHorizontal: 16, paddingVertical: 8,
      borderRadius: t.borderRadius['2xl'], minHeight: 44,
    },
    messageInput: { ...t.typography.bodyMedium, flex: 1, maxHeight: 100, paddingVertical: 4 },
    sendBtn: {
      width: 32, height: 32, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center', marginLeft: 8,
    },
  });
}
