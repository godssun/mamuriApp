/**
 * ReportDetail v3 — Calm paper report detail
 *
 * "조용하고 신뢰감 있는 종이 기록 상세"
 * Ivory paper cards, serif titles, sage accents,
 * warm insight highlights, emotion chips.
 *
 * v3 design system tokens.
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  colors, fontFamily, shadows, spacing, borderRadius, layout,
} from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import { reportApi2 } from '../api/client';
import { EMOTION_COLORS, EMOTION_LABELS } from '../constants/stickers';
import { EmotionStickerView } from './components/EmotionStickerView';

type Props = NativeStackScreenProps<any, 'ReportDetail'>;

export default function ReportDetailScreenV2({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const reportId = route.params?.reportId;

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reportId) {
      reportApi2.getDetail(reportId)
        .then(setReport)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [reportId]);

  if (loading) {
    return (
      <PaperBackground variant="plain" color="cream" style={{ paddingTop: insets.top }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={s.center}>
          <ActivityIndicator color={colors.accentPrimary} />
        </View>
      </PaperBackground>
    );
  }

  if (!report) {
    return (
      <PaperBackground variant="plain" color="cream" style={{ paddingTop: insets.top }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={s.center}>
          <Text style={s.errorText}>리포트를 찾을 수 없습니다.</Text>
        </View>
      </PaperBackground>
    );
  }

  return (
    <PaperBackground variant="plain" color="cream" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>리포트</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Type Badge */}
        <View style={s.typeBadge}>
          <Text style={s.typeBadgeText}>
            {report.reportType === 'WEEKLY' ? '주간 리포트' : '월간 리포트'}
          </Text>
        </View>

        {/* Period */}
        <Text style={s.period}>{report.periodStart} ~ {report.periodEnd}</Text>

        {/* Title */}
        <Text style={s.title}>{report.title}</Text>

        {/* Meta */}
        <Text style={s.meta}>{report.diaryCount}개의 일기를 기반으로 작성되었어요</Text>

        {/* Content */}
        <View style={s.card}>
          <Text style={s.content}>{report.content}</Text>
        </View>

        {/* Growth Insight */}
        {report.growthInsight && (
          <View style={s.insightCard}>
            <Text style={s.insightLabel}>이번 주 성장 포인트</Text>
            <Text style={s.insightText}>{report.growthInsight}</Text>
          </View>
        )}

        {/* Key Events */}
        {report.keyEvents && report.keyEvents.length > 0 && (
          <View style={s.card}>
            <Text style={s.insightLabel}>주요 사건</Text>
            {report.keyEvents.map((event: string, i: number) => (
              <Text key={i} style={s.eventItem}>• {event}</Text>
            ))}
          </View>
        )}

        {/* Emotion Summary */}
        {report.emotionSummary && Object.keys(report.emotionSummary).length > 0 && (
          <View style={s.card}>
            <Text style={s.insightLabel}>감정 분포</Text>
            <View style={s.emotionRow}>
              {Object.entries(report.emotionSummary).map(([emotion, count]) => {
                const emotionColor = EMOTION_COLORS[emotion as keyof typeof EMOTION_COLORS] || colors.accentSand;
                return (
                  <View key={emotion} style={s.emotionChip}>
                    <EmotionStickerView emotionKey={emotion as any} size="mini" />
                    <Text style={[s.emotionCount, { color: emotionColor }]}>
                      {count as number}회
                    </Text>
                    <Text style={s.emotionLabel}>
                      {EMOTION_LABELS[emotion as keyof typeof EMOTION_LABELS] || emotion}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: spacing['4xl'] }} />
      </ScrollView>
    </PaperBackground>
  );
}

const s = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing.md,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontFamily: fontFamily.sansLight, fontSize: 22, color: colors.textPrimary },
  headerTitle: { fontFamily: fontFamily.serifItalic, fontSize: 18, fontWeight: '400', color: colors.textPrimary },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: fontFamily.sans, fontSize: 14, color: colors.textTertiary },

  scroll: { paddingHorizontal: layout.screenPaddingH, paddingBottom: 40 },

  // Type badge
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentPrimaryLight + '30',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  typeBadgeText: {
    fontFamily: fontFamily.sansMedium, fontSize: 12, fontWeight: '600',
    color: colors.accentPrimary,
  },

  // Period
  period: {
    fontFamily: fontFamily.script, fontSize: 14,
    color: colors.textTertiary, marginBottom: spacing.sm,
  },

  // Title
  title: {
    fontFamily: fontFamily.serifItalic, fontSize: 22, fontWeight: '400',
    color: colors.textPrimary, marginBottom: spacing.sm, lineHeight: 30,
  },

  // Meta
  meta: {
    fontFamily: fontFamily.sans, fontSize: 12,
    color: colors.textTertiary, marginBottom: spacing.xl,
  },

  // Content card
  card: {
    backgroundColor: colors.bgIvory, borderRadius: borderRadius.sm,
    padding: spacing.xl, marginBottom: spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    ...shadows.crisp,
  },
  content: {
    fontFamily: fontFamily.sans, fontSize: 15, lineHeight: 24,
    color: colors.textPrimary,
  },

  // Insight card
  insightCard: {
    backgroundColor: colors.accentPrimaryLight + '15',
    borderRadius: borderRadius.sm,
    padding: spacing.xl, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.accentPrimaryLight + '30',
  },
  insightLabel: {
    fontFamily: fontFamily.sansMedium, fontSize: 13, fontWeight: '600',
    color: colors.textPrimary, marginBottom: spacing.md,
  },
  insightText: {
    fontFamily: fontFamily.sans, fontSize: 14, lineHeight: 22,
    color: colors.accentPrimary,
  },

  // Events
  eventItem: {
    fontFamily: fontFamily.sans, fontSize: 13,
    color: colors.textSecondary, marginBottom: spacing.xs, lineHeight: 20,
  },

  // Emotion
  emotionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  emotionChip: { alignItems: 'center', gap: spacing.xs },
  emotionCount: { fontFamily: fontFamily.sansMedium, fontSize: 11, fontWeight: '600' },
  emotionLabel: { fontFamily: fontFamily.sans, fontSize: 9, color: colors.textTertiary },
});
