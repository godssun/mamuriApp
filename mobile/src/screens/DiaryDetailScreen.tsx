import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { diaryApi, ApiError } from '../api/client';
import { Diary, DiaryStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<DiaryStackParamList, 'DiaryDetail'>;
  route: RouteProp<DiaryStackParamList, 'DiaryDetail'>;
};

export default function DiaryDetailScreen({ navigation, route }: Props) {
  const { diaryId } = route.params;
  const [diary, setDiary] = useState<Diary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    loadDiary();
  }, [diaryId]);

  const loadDiary = async () => {
    try {
      const data = await diaryApi.getDetail(diaryId);
      setDiary(data);
    } catch (error) {
      console.error('Failed to load diary:', error);
      Alert.alert('오류', '일기를 불러올 수 없습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryAiComment = async () => {
    setIsRetrying(true);
    try {
      const newComment = await diaryApi.retryAiComment(diaryId);
      setDiary((prev) =>
        prev ? { ...prev, aiComment: newComment } : null
      );
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'AI 코멘트 생성에 실패했습니다.';
      Alert.alert('재시도 실패', message);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '일기 삭제',
      '이 일기를 삭제하시겠어요?\n삭제된 일기는 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await diaryApi.delete(diaryId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${year}년 ${month}월 ${day}일 (${weekday})`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9B7A" />
      </View>
    );
  }

  if (!diary) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 뒤로</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.deleteButton}>삭제</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.date}>{formatDate(diary.createdAt)}</Text>
        <Text style={styles.title}>{diary.title}</Text>
        <Text style={styles.diaryContent}>{diary.content}</Text>

        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <Text style={styles.aiTitle}>마무리의 코멘트</Text>
            <TouchableOpacity
              onPress={handleRetryAiComment}
              disabled={isRetrying}
              style={styles.retryButton}
            >
              {isRetrying ? (
                <ActivityIndicator size="small" color="#FF9B7A" />
              ) : (
                <Text style={styles.retryText}>다시 받기</Text>
              )}
            </TouchableOpacity>
          </View>

          {diary.aiComment ? (
            <View style={styles.aiCommentCard}>
              <Text style={styles.aiCommentContent}>
                {diary.aiComment.content}
              </Text>
            </View>
          ) : (
            <View style={styles.aiCommentCard}>
              <Text style={styles.noCommentText}>
                아직 AI 코멘트가 없습니다.
              </Text>
              <TouchableOpacity
                onPress={handleRetryAiComment}
                disabled={isRetrying}
                style={styles.getCommentButton}
              >
                <Text style={styles.getCommentButtonText}>
                  코멘트 받기
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    fontSize: 16,
    color: '#FF9B7A',
  },
  deleteButton: {
    fontSize: 16,
    color: '#FF6B6B',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  date: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 20,
  },
  diaryContent: {
    fontSize: 16,
    color: '#2D2D2D',
    lineHeight: 28,
    marginBottom: 32,
  },
  aiSection: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 24,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryText: {
    fontSize: 14,
    color: '#FF9B7A',
  },
  aiCommentCard: {
    backgroundColor: '#FFF0EB',
    borderRadius: 16,
    padding: 20,
  },
  aiCommentContent: {
    fontSize: 15,
    color: '#2D2D2D',
    lineHeight: 26,
  },
  noCommentText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  getCommentButton: {
    backgroundColor: '#FF9B7A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  getCommentButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
