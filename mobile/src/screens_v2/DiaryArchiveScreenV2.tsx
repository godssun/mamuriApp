/**
 * DiaryArchive v3 — Scrapbook diary archive
 *
 * "조용히 쌓여 있는 기록 보관함"
 * Monthly grouped section list on warm paper surface.
 * Serif month headers, ivory diary cards, sage accents.
 *
 * v3 design system tokens.
 */

import React, { useCallback, useState } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  colors, fontFamily, shadows, spacing, borderRadius, layout,
} from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import { diaryApi } from '../api/client';
import { Diary, MainStackParamList } from '../types';
import { formatDiaryDate, formatYearMonth } from '../utils/dateFormat';
import { DiaryCard } from './components/Card';

type Section = { title: string; data: Diary[] };

function groupByMonth(diaries: Diary[]): Section[] {
  const map = new Map<string, Diary[]>();
  for (const d of diaries) {
    const [y, m] = d.diaryDate.split('-');
    const key = formatYearMonth(Number(y), Number(m) - 1);
    const list = map.get(key) ?? [];
    list.push(d);
    map.set(key, list);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export function DiaryArchiveScreenV2() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await diaryApi.getList();
      setDiaries(data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const handleRefresh = () => { setRefreshing(true); fetchData(); };
  const sections = groupByMonth(diaries);

  if (loading) {
    return (
      <PaperBackground variant="plain" color="cream" style={{ paddingTop: insets.top }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>{t('diary.archive')}</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={s.loadingCenter}>
          <ActivityIndicator color={colors.accentPrimary} />
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
        <Text style={s.headerTitle}>{t('diary.archive')}</Text>
        <View style={s.countBadge}>
          <Text style={s.countText}>
            {t('diary.archiveCount', { count: diaries.length })}
          </Text>
        </View>
      </View>

      {diaries.length === 0 ? (
        <View style={s.emptyContainer}>
          <View style={s.emptyPage}>
            <View style={s.emptyLine} />
            <View style={[s.emptyLine, { width: '60%' }]} />
            <View style={[s.emptyLine, { width: '40%' }]} />
          </View>
          <Text style={s.emptyTitle}>{t('diary.archiveEmpty')}</Text>
          <Text style={s.emptyDesc}>{t('diary.archiveEmptyDesc')}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderSectionHeader={({ section }) => (
            <Text style={s.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <View style={s.cardWrap}>
              <DiaryCard
                date={formatDiaryDate(item.diaryDate)}
                title={item.title}
                preview={item.content}
                hasAIComment={!!item.aiComment}
                onPress={() => navigation.navigate('DiaryDetailFromArchive', { diaryId: item.id })}
              />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing['3xl'] }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accentPrimary} />
          }
        />
      )}
    </PaperBackground>
  );
}

const s = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.lg, paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.accentSand + '30',
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontFamily: fontFamily.sansLight, fontSize: 22, color: colors.textPrimary },
  headerTitle: { fontFamily: fontFamily.serifItalic, fontSize: 18, fontWeight: '400', color: colors.textPrimary },
  countBadge: { width: 44, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: fontFamily.sans, fontSize: 11, color: colors.textTertiary },

  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Section header — serif month label
  sectionHeader: {
    fontFamily: fontFamily.serifItalic, fontSize: 15, fontWeight: '400',
    color: colors.textTertiary,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.xl, paddingBottom: spacing.sm,
  },

  // Card wrapper
  cardWrap: {
    paddingHorizontal: layout.screenPaddingH,
    marginBottom: spacing.sm,
  },

  // Empty state
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyPage: {
    width: 100, height: 130,
    backgroundColor: colors.bgIvory, borderRadius: borderRadius.xs,
    padding: spacing.xl, justifyContent: 'center', gap: spacing.md,
    ...shadows.crisp, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: spacing['2xl'],
  },
  emptyLine: { height: 2, backgroundColor: colors.accentSand + '30', borderRadius: 1, width: '80%' },
  emptyTitle: { fontFamily: fontFamily.serifItalic, fontSize: 18, color: colors.textPrimary, textAlign: 'center' },
  emptyDesc: { fontFamily: fontFamily.sans, fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center', lineHeight: 20 },
});
