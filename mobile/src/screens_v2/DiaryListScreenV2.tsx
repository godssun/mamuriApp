/**
 * DiaryListScreen v3 — Editorial scrapbook diary collection
 *
 * "기억 페이지를 넘겨보는 스크랩북 리스트"
 *
 * Each diary entry is a curated scrapbook page — not a generic card.
 * Photos in polaroid frames, serif titles, script dates,
 * tape accents, warm paper composition.
 *
 * DateStrip removed — replaced with minimal serif month header.
 * Fetches all recent diaries (not date-filtered) for browse feel.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Animated, RefreshControl,
  ActivityIndicator, TouchableOpacity, Image, Platform, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  colors, fontFamily, shadows, spacing, borderRadius, layout,
} from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import i18n from '../i18n/i18n';
import { diaryApi, diaryApiV3, companionApi } from '../api/client';
import { DiaryV3, StreakResponse, DiaryStackParamListV3, EmotionKey } from '../types';
import { formatDiaryDate } from '../utils/dateFormat';
import { EmotionStickerView } from './components/EmotionStickerView';
import { EMOTION_COLORS, EMOTION_LABELS } from '../constants/stickers';

const { width: SCREEN_W } = Dimensions.get('window');
const CONTENT_W = SCREEN_W - spacing['2xl'] * 2;

type Props = NativeStackScreenProps<DiaryStackParamListV3, 'DiaryListHome'>;

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Polaroid rotation per card index — hand-placed feel
const polaroidRotations = ['-2deg', '1.5deg', '-1deg', '2deg', '-0.5deg'];
// Tape presence per card
const showTapeFor = [true, false, true, false, true];

export function DiaryListScreenV2({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const listAnim = useRef(new Animated.Value(0)).current;

  const filterDate = route.params?.filterDate;
  const [selectedDate, setSelectedDate] = useState(
    filterDate ? new Date(filterDate + 'T00:00:00') : new Date()
  );

  useEffect(() => {
    if (filterDate) {
      setSelectedDate(new Date(filterDate + 'T00:00:00'));
      navigation.setParams({ filterDate: undefined } as any);
    }
  }, [filterDate]);

  const [diaries, setDiaries] = useState<DiaryV3[]>([]);
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Animated.spring(listAnim, { toValue: 1, tension: 40, friction: 10, useNativeDriver: true }).start();
  }, []);

  const fetchDiaries = useCallback(async () => {
    try {
      const dateKey = formatDateKey(selectedDate);
      const [diaryData, streakData] = await Promise.all([
        diaryApiV3.getListByDateV3(dateKey),
        companionApi.getStreak(),
      ]);
      setDiaries(diaryData);
      setStreak(streakData);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useFocusEffect(useCallback(() => { fetchDiaries(); }, [fetchDiaries]));

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDiaries();
  }, [fetchDiaries]);

  // Resolve photo URL
  const resolvePhoto = (item: DiaryV3): string | null => {
    const firstPhoto = item.photos && item.photos.length > 0 ? item.photos[0] : null;
    if (!firstPhoto) return null;
    const raw = firstPhoto.cdnUrl || (firstPhoto as any).url || '';
    if (raw.startsWith('http')) return raw;
    const host = __DEV__ ? `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:8080` : 'https://api.mamuri.app';
    return `${host}${raw}`;
  };

  const renderDiaryItem = ({ item, index }: { item: DiaryV3; index: number }) => {
    const emotionCode = (
      item.emotion?.primarySticker?.category?.code
      || item.emotion?.primarySticker?.code?.replace(/_default$/, '')?.toUpperCase()
      || (item as any).primaryEmotion
    ) as EmotionKey | undefined;
    const emotionColor = emotionCode ? EMOTION_COLORS[emotionCode] : null;
    const photoUrl = resolvePhoto(item);
    const rotation = polaroidRotations[index % polaroidRotations.length];
    const hasTape = showTapeFor[index % showTapeFor.length];
    const diaryDate = new Date(item.diaryDate);
    const dateLabel = `${diaryDate.getMonth() + 1}월 ${diaryDate.getDate()}일`;

    return (
      <Animated.View style={[
        styles.entryContainer,
        {
          opacity: listAnim,
          transform: [{
            translateY: listAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [24 + index * 12, 0],
            }),
          }],
        },
      ]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('DiaryDetail', { diaryId: item.id })}
          activeOpacity={0.8}
          style={styles.pageCard}
        >
          {/* ── Tape decoration (on some cards) ── */}
          {hasTape && <View style={styles.tape} />}

          {/* ── Date — handwritten script ── */}
          <Text style={styles.dateScript}>{dateLabel}</Text>

          {/* ── Photo — polaroid framing ── */}
          {photoUrl && (
            <View style={[styles.polaroidWrap, { transform: [{ rotate: rotation }] }]}>
              <View style={styles.polaroidFrame}>
                <Image
                  source={{ uri: photoUrl }}
                  style={styles.polaroidPhoto}
                  resizeMode="cover"
                />
                {/* Vintage warmth overlay */}
                <View style={styles.vintageOverlay} />
              </View>
            </View>
          )}

          {/* ── Emotion indicator ── */}
          {emotionCode && (
            <View style={styles.emotionRow}>
              <EmotionStickerView emotionKey={emotionCode} size="small" />
              <Text style={[styles.emotionText, { color: emotionColor || colors.textSecondary }]}>
                {EMOTION_LABELS[emotionCode]}
              </Text>
            </View>
          )}

          {/* ── Title — editorial serif ── */}
          <Text numberOfLines={2} style={styles.entryTitle}>
            {item.title}
          </Text>

          {/* ── Content preview ── */}
          <Text numberOfLines={3} style={styles.entryPreview}>
            {item.content.substring(0, 150)}
          </Text>

          {/* ── Footer: formatted date + AI indicator ── */}
          <View style={styles.entryFooter}>
            <Text style={styles.footerDate}>{formatDiaryDate(item.diaryDate)}</Text>
            {item.aiComment !== null && (
              <View style={styles.aiTag}>
                <View style={styles.aiDot} />
                <Text style={styles.aiTagText}>마무리의 한마디</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.accentPrimary} />
        </View>
      );
    }

    const isToday = formatDateKey(selectedDate) === formatDateKey(new Date());

    return (
      <Animated.View style={[styles.emptyState, { opacity: listAnim }]}>
        {/* Empty page illustration */}
        <View style={styles.emptyPage}>
          <View style={styles.emptyPageLine} />
          <View style={[styles.emptyPageLine, { width: '60%' }]} />
          <View style={[styles.emptyPageLine, { width: '40%' }]} />
        </View>
        <Text style={styles.emptyTitle}>
          {isToday ? '오늘의 페이지가 비어있어요' : '이 날의 기록이 없어요'}
        </Text>
        <Text style={styles.emptyDesc}>
          {isToday
            ? '오늘의 감정을 한 장의 페이지로 남겨보세요'
            : '다른 날의 기록을 둘러보세요'}
        </Text>

        {isToday && (
          <TouchableOpacity
            style={styles.writeBtn}
            onPress={() => navigation.navigate('WriteDiary', {})}
            activeOpacity={0.8}
          >
            <Text style={styles.writeBtnText}>페이지 시작하기</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  const now = new Date();
  const monthLabel = `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월`;

  return (
    <PaperBackground variant="plain" color="cream">
      {/* ── Header — minimal, editorial ── */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>나의 기록</Text>
            <Text style={styles.headerMonth}>{monthLabel}</Text>
          </View>

          {streak && streak.currentStreak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakNum}>{streak.currentStreak}</Text>
              <Text style={styles.streakLabel}>일째</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Diary entries ── */}
      <FlatList
        data={diaries}
        renderItem={renderDiaryItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingHorizontal: spacing['2xl'],
          paddingTop: spacing['2xl'],
          paddingBottom: insets.bottom + 120,
          flexGrow: diaries.length === 0 ? 1 : undefined,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accentPrimary}
          />
        }
      />
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  // ── Header ──
  header: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 28, fontWeight: '400',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerMonth: {
    fontFamily: fontFamily.sans,
    fontSize: 13, color: colors.textTertiary,
    marginTop: 4,
  },
  streakBadge: {
    alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.sm,
    ...shadows.crisp,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  streakNum: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 22, color: colors.accentPrimary, fontWeight: '500',
  },
  streakLabel: {
    fontFamily: fontFamily.sans,
    fontSize: 10, color: colors.textTertiary, marginTop: 1,
  },

  // ── Page Card — each entry is a scrapbook page ──
  entryContainer: {
    marginBottom: spacing['3xl'],
  },
  pageCard: {
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.xs,
    padding: spacing['2xl'],
    paddingTop: spacing['3xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...shadows.soft,
  },

  // Tape decoration
  tape: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 20,
    backgroundColor: colors.glassWhiteLight,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
    transform: [{ rotate: '1.5deg' }],
    zIndex: 10,
  },

  // Date — handwritten script at top
  dateScript: {
    fontFamily: fontFamily.script,
    fontSize: 20, color: colors.textSecondary,
    marginBottom: spacing.xl,
    transform: [{ rotate: '-1deg' }],
  },

  // Polaroid photo frame
  polaroidWrap: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  polaroidFrame: {
    backgroundColor: colors.surfacePure,
    padding: 8,
    paddingBottom: 28,
    width: CONTENT_W - spacing['2xl'] * 2,
    ...shadows.soft,
  },
  polaroidPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 1,
  },
  vintageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(180, 150, 120, 0.05)',
    margin: 8,
    marginBottom: 28,
  },

  // Emotion row
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  emotionText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 13, fontWeight: '600',
  },

  // Title — editorial serif, strong hierarchy
  entryTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 22, fontWeight: '400',
    color: colors.textPrimary,
    lineHeight: 30,
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  },

  // Content preview
  entryPreview: {
    fontFamily: fontFamily.sans,
    fontSize: 14, lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  // Footer
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.accentSand + '30',
    paddingTop: spacing.md,
  },
  footerDate: {
    fontFamily: fontFamily.sans,
    fontSize: 11, color: colors.textTertiary,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: colors.accentPrimary,
  },
  aiTagText: {
    fontFamily: fontFamily.sans,
    fontSize: 11, color: colors.accentPrimary,
  },

  // ── Empty state ──
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingBottom: 60,
  },
  emptyPage: {
    width: 120, height: 160,
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.xs,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.md,
    ...shadows.crisp,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: spacing['2xl'],
  },
  emptyPageLine: {
    height: 2,
    backgroundColor: colors.accentSand + '30',
    borderRadius: 1,
    width: '80%',
  },
  emptyTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 18, color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyDesc: {
    fontFamily: fontFamily.sans,
    fontSize: 13, lineHeight: 20,
    color: colors.textSecondary,
    marginTop: spacing.sm, textAlign: 'center',
  },
  writeBtn: {
    borderWidth: 1, borderColor: colors.accentPrimary,
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: 28, paddingVertical: 14,
    marginTop: spacing.xl,
    backgroundColor: 'rgba(253, 252, 248, 0.5)',
  },
  writeBtnText: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 15, color: colors.textPrimary,
  },
});
