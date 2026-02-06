import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { diaryApi } from '../api/client';
import { Diary, DiaryStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<DiaryStackParamList, 'DiaryListHome'>;
};

export default function DiaryListScreen({ navigation }: Props) {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDiaries = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const data = await diaryApi.getList();
      // 최신순 정렬
      setDiaries(data.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Failed to load diaries:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDiaries();
    }, [loadDiaries])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDiaries(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${month}월 ${day}일 (${weekday})`;
  };

  const renderItem = ({ item }: { item: Diary }) => (
    <TouchableOpacity
      style={styles.diaryCard}
      onPress={() => navigation.navigate('DiaryDetail', { diaryId: item.id })}
      activeOpacity={0.7}
    >
      <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.content} numberOfLines={2}>{item.content}</Text>
      {item.aiComment && (
        <View style={styles.aiCommentBadge}>
          <Text style={styles.aiCommentText}>AI 코멘트</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>📝</Text>
      <Text style={styles.emptyTitle}>아직 일기가 없어요</Text>
      <Text style={styles.emptySubtitle}>
        오늘 하루는 어떠셨나요?{'\n'}
        첫 번째 일기를 작성해보세요
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9B7A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>나의 일기</Text>
      </View>

      <FlatList
        data={diaries}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContent,
          diaries.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FF9B7A"
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('WriteDiary')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
  },
  diaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  aiCommentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  aiCommentText: {
    fontSize: 12,
    color: '#FF9B7A',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF9B7A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF9B7A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2,
  },
});
