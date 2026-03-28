/**
 * DiaryPageDetail V3 — Scrapbook diary record view
 *
 * "기록 조각을 열었더니, 한 장의 감정 페이지가 펼쳐지는 느낌"
 *
 * Paper-textured background, serif editorial hierarchy,
 * emotion as quiet page element, polaroid-framed photos,
 * warm conversation cards, soft input bar.
 *
 * v3 design system: PaperBackground, tokens, scrapbook composition.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, TextInput, ActivityIndicator, Alert, Dimensions, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fontFamily, shadows, spacing, borderRadius, layout } from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import { diaryApiV3, diaryApi, conversationApi } from '../api/client';
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

  // ── Loading state ──
  if (loading) {
    return (
      <PaperBackground variant="plain" color="cream" style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerSideBtn}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <View style={{ width: 44 }} />
        </View>
        <View style={s.loadingCenter}>
          <ActivityIndicator color={colors.accentPrimary} />
        </View>
      </PaperBackground>
    );
  }

  if (!diary) return null;

  // ── Data extraction ──
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
  const diaryDate = new Date(diary.diaryDate);
  const dateLabel = `${diaryDate.getMonth() + 1}월 ${diaryDate.getDate()}일`;

  // Convert photos + decorations to CanvasObjectData[]
  const canvasObjects: CanvasObjectData[] = [
    ...(diary.photos || []).map((p: any, i: number) => {
      const photoW = p.displayWidth || Math.min(canvasW * 0.9, 300);
      const photoH = p.displayHeight || photoW * 0.75;
      return {
        id: `photo_${p.id}`, type: 'photo' as const,
        x: (p.positionX ?? 0.1) * canvasW, y: (p.positionY ?? 0.05) * canvasW,
        width: photoW, height: photoH,
        rotation: p.rotation || 0, zIndex: p.zIndex ?? i,
        photoUri: resolvePhotoUrl(p),
      };
    }),
    ...(diary.decorations || []).map(deco => {
      const code = deco.assetCode || deco.assetType || '';
      const stickerSize = Math.round(60 * (deco.scale || 1));
      return {
        id: `deco_${deco.id}`, type: 'sticker' as const,
        x: (deco.positionX || 0) * canvasW, y: (deco.positionY || 0) * canvasW,
        width: stickerSize, height: stickerSize,
        rotation: deco.rotation || 0, zIndex: deco.zIndex || 0,
        stickerCode: code, stickerSource: getStickerSource(code) || undefined,
      };
    }),
  ];

  return (
    <PaperBackground variant="plain" color="cream" style={[s.root, { paddingTop: insets.top }]}>
      {/* ══ Header — transparent, minimal ══ */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerSideBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.headerDateLabel}>{formatDiaryDate(diary.diaryDate)}</Text>
        </View>
        <TouchableOpacity style={s.headerSideBtn} onPress={handleMorePress}>
          <Text style={s.moreIcon}>⋯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{
          opacity: contentAnim,
          transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }}>
          {/* ══ Page Header — date + emotion composition ══ */}
          <View style={s.pageHeader}>
            {/* Large script date — handwritten feel */}
            <Text style={s.dateScript}>{dateLabel}</Text>

            {/* Emotion as quiet page element */}
            {emotionCode && (
              <View style={s.emotionPiece}>
                <EmotionStickerView emotionKey={emotionCode} size="medium" />
                <View style={s.emotionTextGroup}>
                  <Text style={[s.emotionName, { color: emotionColor || colors.textSecondary }]}>
                    {EMOTION_LABELS[emotionCode]}
                  </Text>
                  {diary.emotion?.secondaryTags && diary.emotion.secondaryTags.length > 0 && (
                    <Text style={s.emotionTags}>
                      {diary.emotion.secondaryTags.join(' · ')}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Time */}
            <Text style={s.timeMeta}>{formatTime(diary.createdAt)}</Text>
          </View>

          {/* ══ Diary Canvas (shared renderer) ══ */}
          <View style={s.canvasCard}>
            <DiaryPageRenderer
              title={diary.title || ''}
              content={diary.content || ''}
              theme={diaryTheme}
              objects={canvasObjects}
              editable={false}
              textColor={txtColor}
              borderColor={diaryTheme === 'night' ? '#2A2A3A' : colors.accentSand + '20'}
              bgColor={bgColor}
            />
          </View>

          {/* ══ AI Conversation — warm paper cards ══ */}
          {messages.length > 0 && (
            <View style={s.conversationWrap}>
              {/* Section divider */}
              <View style={s.sectionDivider}>
                <View style={s.dividerLine} />
                <View style={s.dividerLabel}>
                  <View style={s.dividerDot} />
                  <Text style={s.dividerText}>마무리의 이야기</Text>
                </View>
                <View style={s.dividerLine} />
              </View>

              {/* Messages */}
              <View style={s.messagesContainer}>
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
        </Animated.View>
      </ScrollView>

      {/* ══ Input bar — warm paper tone ══ */}
      <View style={[s.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <View style={s.inputInner}>
          <TextInput
            style={s.textInput}
            placeholder="이야기를 이어가보세요..."
            placeholderTextColor={colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isAITyping}
            style={[
              s.sendBtn,
              (inputText.trim() && !isAITyping) ? s.sendBtnActive : s.sendBtnInactive,
            ]}
          >
            <Text style={[
              s.sendIcon,
              { color: (inputText.trim() && !isAITyping) ? colors.surfacePure : colors.textTertiary },
            ]}>
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

const s = StyleSheet.create({
  root: { flex: 1 },

  // ── Header ──
  header: {
    height: 52, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  headerSideBtn: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
  },
  backArrow: {
    fontSize: 22, color: colors.textPrimary, fontFamily: fontFamily.sansLight,
  },
  headerDateLabel: {
    fontFamily: fontFamily.sans,
    fontSize: 12, color: colors.textTertiary,
    letterSpacing: 0.3,
  },
  moreIcon: { fontSize: 20, color: colors.textTertiary },

  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Page Header — editorial composition ──
  pageHeader: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
  },
  dateScript: {
    fontFamily: fontFamily.script,
    fontSize: 28, color: colors.textSecondary,
    transform: [{ rotate: '-1deg' }],
    marginBottom: spacing.xl,
  },
  emotionPiece: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  emotionTextGroup: { gap: 2 },
  emotionName: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 15, fontWeight: '600',
  },
  emotionTags: {
    fontFamily: fontFamily.sans,
    fontSize: 12, color: colors.textTertiary,
  },
  timeMeta: {
    fontFamily: fontFamily.sans,
    fontSize: 11, color: colors.textTertiary,
    letterSpacing: 0.2,
  },

  // ── Canvas card — scrapbook page container ──
  canvasCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
    ...shadows.soft,
  },

  // ── Conversation — warm section ──
  conversationWrap: {
    paddingHorizontal: spacing['2xl'],
    marginTop: spacing['4xl'],
  },
  sectionDivider: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, marginBottom: spacing['2xl'],
  },
  dividerLine: {
    flex: 1, height: StyleSheet.hairlineWidth,
    backgroundColor: colors.accentSand + '40',
  },
  dividerLabel: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.full,
    ...shadows.crisp,
    gap: spacing.xs,
  },
  dividerDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.accentPrimary,
  },
  dividerText: {
    fontFamily: fontFamily.sans,
    fontSize: 11, color: colors.accentPrimary,
    letterSpacing: 0.3,
  },
  messagesContainer: {
    gap: spacing.sm,
  },

  // ── Input bar — warm paper ──
  inputBar: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.accentSand + '20',
    backgroundColor: colors.glassWhite,
  },
  inputInner: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.accentSand + '20',
  },
  textInput: {
    flex: 1, maxHeight: 100, paddingVertical: 4,
    fontFamily: fontFamily.sans, fontSize: 15,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm,
  },
  sendBtnActive: { backgroundColor: colors.accentPrimary },
  sendBtnInactive: { backgroundColor: 'transparent' },
  sendIcon: { fontSize: 16 },
});
