/**
 * DiaryPageDetail V3 — Immersive diary detail with canvas rendering
 *
 * - Emotion sticker header
 * - 2-layer canvas: background pattern + text + objects (CanvasObject read-only)
 * - AI conversation area
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, TextInput, ActivityIndicator, Alert, Image, Dimensions, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fontFamily, shadows, spacing, borderRadius, layout } from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import { diaryApiV3, diaryApi, conversationApi, ApiError } from '../api/client';
import type { DiaryV3, ConversationMessage, ConversationLimits, DiaryStackParamListV3, EmotionKey } from '../types';
import { formatDiaryDate, formatTime } from '../utils/dateFormat';
import { ChatBubble } from './components/ChatBubble';
import { ReportModal } from './components/ReportModal';
import { EMOTION_COLORS, EMOTION_LABELS } from '../constants/stickers';
import { EmotionStickerView } from './components/EmotionStickerView';
import { DiaryPageRenderer, CANVAS_PADDING_H } from './components/DiaryPageRenderer';
import type { CanvasObjectData } from './components/CanvasObject';
import { getStickerSource } from '../constants/stickerSources';

const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const SERVER_ORIGIN = __DEV__ ? `http://${DEV_HOST}:8080` : 'https://api.mamuri.app';

function resolvePhotoUrl(photo: { cdnUrl?: string; url?: string }): string {
  const raw = photo.cdnUrl || photo.url || '';
  if (raw.startsWith('http')) return raw;
  return `${SERVER_ORIGIN}${raw}`;
}

type Props = NativeStackScreenProps<DiaryStackParamListV3, 'DiaryDetail'>;

const themeColors: Record<string, string> = {
  night: '#1A1A2E',
  warm: colors.bgWarm,
  nature: colors.bgCream,
  note: colors.bgIvory,
  grid: colors.bgCream,
};


export default function DiaryPageDetailV3({ navigation, route }: Props) {
  const { diaryId } = route.params;
  const insets = useSafeAreaInsets();

  const [diary, setDiary] = useState<DiaryV3 | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [limits, setLimits] = useState<ConversationLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [reportMessageId, setReportMessageId] = useState<number | null>(null);

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
      <PaperBackground variant="plain" color="cream" style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={{ width: 44 }} />
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={colors.accentPrimary} />
        </View>
      </PaperBackground>
    );
  }

  if (!diary) return null;

  // Extract emotion (fallback chain)
  const emotionCode = (
    diary.emotion?.primarySticker?.category?.code
    || diary.emotion?.primarySticker?.code?.replace(/_default$/, '')?.toUpperCase()
    || (diary as any).primaryEmotion
    || (diary as any).emotion?.primaryEmotion
  ) as EmotionKey | undefined;
  const emotionColor = emotionCode ? EMOTION_COLORS[emotionCode] : null;
  const diaryTheme = diary.theme || 'note';
  const bgColor = themeColors[diaryTheme] || colors.bgCream;
  const txtColor = diaryTheme === 'night' ? '#EDEDF0' : colors.textPrimary;
  const canvasW = Dimensions.get('window').width - (CANVAS_PADDING_H * 2);

  // Convert photos + decorations to CanvasObjectData[]
  const canvasObjects: CanvasObjectData[] = [
    // Photos — use saved coordinates from photo API
    ...(diary.photos || []).map((p: any, i: number) => {
      const photoW = p.displayWidth || Math.min(canvasW * 0.9, 300);
      const photoH = p.displayHeight || photoW * 0.75;
      return {
        id: `photo_${p.id}`,
        type: 'photo' as const,
        x: (p.positionX ?? 0.1) * canvasW,
        y: (p.positionY ?? 0.05) * canvasW,
        width: photoW,
        height: photoH,
        rotation: p.rotation || 0,
        zIndex: p.zIndex ?? i,
        photoUri: resolvePhotoUrl(p),
      };
    }),
    // Sticker decorations only
    ...(diary.decorations || [])
      .map(deco => {
        const code = deco.assetCode || deco.assetType || '';
        const stickerSize = Math.round(60 * (deco.scale || 1));
        return {
          id: `deco_${deco.id}`,
          type: 'sticker' as const,
          x: (deco.positionX || 0) * canvasW,
          y: (deco.positionY || 0) * canvasW,
          width: stickerSize,
          height: stickerSize,
          rotation: deco.rotation || 0,
          zIndex: deco.zIndex || 0,
          stickerCode: code,
          stickerSource: getStickerSource(code) || undefined,
        };
      }),
  ];

  return (
    <PaperBackground variant="plain" color="cream" style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: txtColor }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerDate, { color: diaryTheme === 'night' ? '#9898AC' : colors.textSecondary }]}>
          {formatDiaryDate(diary.diaryDate)}
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleMorePress}>
          <Text style={[styles.moreText, { color: diaryTheme === 'night' ? '#9898AC' : colors.textSecondary }]}>⋯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ Diary Page (shared renderer) ═══ */}
        <Animated.View style={{
          opacity: contentAnim,
          transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }}>
          {/* Emotion Header */}
          {emotionCode && (
            <View style={[styles.emotionHeader, {
              backgroundColor: (emotionColor || colors.accentPrimary) + '10',
              borderColor: (emotionColor || colors.accentPrimary) + '20',
            }]}>
              <EmotionStickerView emotionKey={emotionCode} size="small" />
              <View>
                <Text style={[styles.emotionLabel, { color: emotionColor || colors.accentPrimary }]}>
                  {EMOTION_LABELS[emotionCode]}
                </Text>
                {diary.emotion?.secondaryTags && diary.emotion.secondaryTags.length > 0 && (
                  <Text style={[styles.emotionTags, { color: (emotionColor || colors.accentPrimary) + 'AA' }]}>
                    {diary.emotion.secondaryTags.join(' · ')}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Meta */}
          <View style={{ paddingHorizontal: CANVAS_PADDING_H }}>
            <Text style={[styles.meta, { color: diaryTheme === 'night' ? '#686880' : colors.textTertiary }]}>
              {formatTime(diary.createdAt)}
            </Text>
          </View>

          <DiaryPageRenderer
            title={diary.title || ''}
            content={diary.content || ''}
            theme={diaryTheme}
            objects={canvasObjects}
            editable={false}
            textColor={txtColor}
            borderColor={diaryTheme === 'night' ? '#2A2A3A' : colors.accentSand + '40'}
            bgColor={bgColor}
          />
        </Animated.View>

        {/* Conversation */}
        {messages.length > 0 && (
          <View style={[styles.conversationSection, { paddingHorizontal: layout.screenPaddingH }]}>
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.accentSand + '30' }]} />
              <View style={styles.aiLabel}>
                <View style={styles.aiDot} />
                <Text style={styles.aiLabelText}>대화</Text>
              </View>
              <View style={[styles.dividerLine, { backgroundColor: colors.accentSand + '30' }]} />
            </View>

            <View style={{ marginTop: spacing.xl }}>
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
      <View style={[styles.inputBar, {
        borderTopColor: diaryTheme === 'night' ? '#2A2A3A' : colors.glassBorderSubtle,
        paddingBottom: insets.bottom + 8,
      }]}>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.messageInput, { color: txtColor }]}
            placeholder="이야기를 이어가보세요..."
            placeholderTextColor={diaryTheme === 'night' ? '#686880' : colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isAITyping}
            style={[styles.sendBtn, {
              backgroundColor: inputText.trim() && !isAITyping ? colors.accentPrimary : 'transparent',
            }]}
          >
            <Text style={{ fontSize: 16, color: inputText.trim() && !isAITyping ? '#FFFFFF' : colors.textTertiary }}>
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
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: layout.screenPaddingH,
    borderBottomWidth: 1, borderBottomColor: colors.accentSand + '40',
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: colors.textPrimary },
  headerDate: {
    fontFamily: fontFamily.serifItalic, fontSize: 14, color: colors.textSecondary,
  },
  moreText: { fontSize: 22, color: colors.textSecondary },

  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Emotion header
  emotionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: CANVAS_PADDING_H, paddingVertical: 12,
    borderRadius: borderRadius.sm, marginTop: spacing.xl, gap: 10,
    borderWidth: 1,
  },
  emotionLabel: { fontSize: 16, fontFamily: fontFamily.sansMedium },
  emotionTags: { fontSize: 12, fontFamily: fontFamily.sans, marginTop: 2 },

  meta: { fontSize: 12, fontFamily: fontFamily.sans, color: colors.textTertiary, marginTop: spacing.sm },

  // Conversation
  conversationSection: { marginTop: spacing['3xl'] },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  aiLabel: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accentPrimaryLight + '40',
  },
  aiDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.accentPrimary, marginRight: 6,
  },
  aiLabelText: { fontSize: 12, fontFamily: fontFamily.sansMedium, color: colors.accentPrimary },

  // Input
  inputBar: {
    paddingTop: 12, paddingHorizontal: layout.screenPaddingH,
    borderTopWidth: 1, backgroundColor: colors.glassWhite,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: borderRadius['2xl'], minHeight: 44,
    backgroundColor: colors.bgIvory,
  },
  messageInput: {
    fontSize: 15, fontFamily: fontFamily.sans,
    flex: 1, maxHeight: 100, paddingVertical: 4,
  },
  sendBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
});
