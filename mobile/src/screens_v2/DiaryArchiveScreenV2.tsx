/**
 * DiaryArchiveScreen v2 — Diary Archive (monthly grouped)
 *
 * Companion → "함께한 일기" tap → here
 * Shows all diaries grouped by month with SectionList.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useThemeV2 } from '../design-system-v2';
import { diaryApi } from '../api/client';
import { Diary, MainStackParamList } from '../types';
import { formatDiaryDate, formatYearMonth } from '../utils/dateFormat';
import { DiaryCard } from './components/Card';

type Section = {
  title: string;
  data: Diary[];
};

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
  const { theme } = useThemeV2();
  const insets = useSafeAreaInsets();

  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await diaryApi.getList();
      setDiaries(data);
    } catch (error) {
      console.error('Failed to load diary archive:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const sections = groupByMonth(diaries);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top, paddingHorizontal: theme.layout.screenPaddingH, borderBottomColor: theme.colors.borderSubtle }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[theme.typography.titleLarge, { color: theme.colors.textPrimary }]}>←</Text>
          </TouchableOpacity>
          <Text style={[theme.typography.titleMedium, { color: theme.colors.textPrimary }]}>{t('diary.archive')}</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        paddingTop: insets.top,
        paddingHorizontal: theme.layout.screenPaddingH,
        borderBottomColor: theme.colors.borderSubtle,
      }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[theme.typography.titleLarge, { color: theme.colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[theme.typography.titleMedium, { color: theme.colors.textPrimary }]}>
          {t('diary.archive')}
        </Text>
        <View style={styles.countBadge}>
          <Text style={[theme.typography.labelSmall, { color: theme.colors.textSecondary }]}>
            {t('diary.archiveCount', { count: diaries.length })}
          </Text>
        </View>
      </View>

      {diaries.length === 0 ? (
        /* Empty state */
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={[theme.typography.titleMedium, { color: theme.colors.textPrimary, marginTop: theme.spacing.lg }]}>
            {t('diary.archiveEmpty')}
          </Text>
          <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm, textAlign: 'center' }]}>
            {t('diary.archiveEmptyDesc')}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderSectionHeader={({ section }) => (
            <Text style={[
              theme.typography.titleSmall,
              {
                color: theme.colors.textTertiary,
                paddingHorizontal: theme.layout.screenPaddingH,
                paddingTop: theme.spacing.xl,
                paddingBottom: theme.spacing.sm,
                backgroundColor: theme.colors.background,
              },
            ]}>
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: theme.layout.screenPaddingH, marginBottom: theme.spacing.sm }}>
              <DiaryCard
                date={formatDiaryDate(item.diaryDate)}
                title={item.title}
                preview={item.content}
                hasAIComment={!!item.aiComment}
                onPress={() => navigation.navigate('DiaryDetailFromArchive', { diaryId: item.id })}
              />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + theme.spacing['3xl'] }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  countBadge: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
  },
});
