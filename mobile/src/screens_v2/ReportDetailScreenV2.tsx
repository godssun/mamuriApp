import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemeV2 } from '../design-system-v2';
import { primaryEmotionColors } from '../design-system-v2/colors';
import { reportApi2 } from '../api/client';
import type { Theme } from '../design-system-v2';

const EMOTION_EMOJIS: Record<string, string> = {
  JOY: '😊', CALM: '😌', SAD: '😢', ANXIOUS: '😰', COMPLEX: '🤔',
};

type Props = NativeStackScreenProps<any, 'ReportDetail'>;

export default function ReportDetailScreenV2({ route, navigation }: Props) {
  const { theme } = useThemeV2();
  const insets = useSafeAreaInsets();
  const s = styles(theme);
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
      <View style={[s.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={[s.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.textTertiary }}>리포트를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.backBtn} onPress={() => navigation.goBack()}>← 돌아가기</Text>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Type Badge */}
        <View style={s.typeBadge}>
          <Text style={s.typeBadgeText}>
            {report.reportType === 'WEEKLY' ? '📋 주간 리포트' : '📊 월간 리포트'}
          </Text>
        </View>

        {/* Period */}
        <Text style={s.period}>{report.periodStart} ~ {report.periodEnd}</Text>

        {/* Title */}
        <Text style={s.title}>{report.title}</Text>

        {/* Diary Count */}
        <Text style={s.meta}>{report.diaryCount}개의 일기를 기반으로 작성되었어요</Text>

        {/* Content */}
        <View style={s.contentCard}>
          <Text style={s.content}>{report.content}</Text>
        </View>

        {/* Growth Insight */}
        {report.growthInsight && (
          <View style={[s.contentCard, { backgroundColor: theme.colors.primarySubtle }]}>
            <Text style={s.insightLabel}>💡 이번 주 성장 포인트</Text>
            <Text style={s.insightText}>{report.growthInsight}</Text>
          </View>
        )}

        {/* Key Events */}
        {report.keyEvents && report.keyEvents.length > 0 && (
          <View style={s.contentCard}>
            <Text style={s.insightLabel}>📌 주요 사건</Text>
            {report.keyEvents.map((event: string, i: number) => (
              <Text key={i} style={s.eventItem}>• {event}</Text>
            ))}
          </View>
        )}

        {/* Emotion Summary */}
        {report.emotionSummary && Object.keys(report.emotionSummary).length > 0 && (
          <View style={s.contentCard}>
            <Text style={s.insightLabel}>감정 분포</Text>
            <View style={s.emotionRow}>
              {Object.entries(report.emotionSummary).map(([emotion, count]) => {
                const color = primaryEmotionColors[emotion as keyof typeof primaryEmotionColors] || theme.colors.textTertiary;
                return (
                  <View key={emotion} style={s.emotionChip}>
                    <Text style={{ fontSize: 16 }}>{EMOTION_EMOJIS[emotion] || '❓'}</Text>
                    <Text style={[s.emotionCount, { color }]}>{count as number}회</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { fontSize: 14, color: theme.colors.primary, fontWeight: '500' },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    typeBadge: {
      alignSelf: 'flex-start', backgroundColor: theme.colors.primarySubtle,
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8,
    },
    typeBadgeText: { fontSize: 12, color: theme.colors.primary, fontWeight: '600' },
    period: { fontSize: 12, color: theme.colors.textTertiary, marginBottom: 8 },
    title: { fontSize: 22, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 8, lineHeight: 30 },
    meta: { fontSize: 12, color: theme.colors.textTertiary, marginBottom: 20 },
    contentCard: {
      backgroundColor: theme.colors.surface, borderRadius: 14, padding: 18,
      marginBottom: 14, borderWidth: 1, borderColor: theme.colors.border,
    },
    content: { fontSize: 15, color: theme.colors.textPrimary, lineHeight: 24 },
    insightLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 10 },
    insightText: { fontSize: 14, color: theme.colors.primary, lineHeight: 22 },
    eventItem: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 4, lineHeight: 20 },
    emotionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    emotionChip: { alignItems: 'center', gap: 4 },
    emotionCount: { fontSize: 11, fontWeight: '600' },
  });
