/**
 * DiaryWriteScreen v2 — Premium AI Companion Style
 *
 * Design: Distraction-free writing experience
 * - Large, clean text area
 * - Mood selector with color chips
 * - Character count
 * - Gentle save animation
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useThemeV2 } from '../design-system-v2';
import { diaryApi, ApiError } from '../api/client';
import { useSubscription } from '../contexts/SubscriptionContext';
import { DiaryStackParamList } from '../types';

type Props = NativeStackScreenProps<DiaryStackParamList, 'WriteDiary'>;

const MOODS = [
  { key: 'happy', emoji: '😊' },
  { key: 'calm', emoji: '😌' },
  { key: 'grateful', emoji: '🥰' },
  { key: 'tired', emoji: '😮‍💨' },
  { key: 'anxious', emoji: '😰' },
  { key: 'sad', emoji: '😢' },
  { key: 'angry', emoji: '😤' },
  { key: 'excited', emoji: '🤩' },
] as const;

export function DiaryWriteScreenV2({ navigation, route }: Props) {
  const { theme } = useThemeV2();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { refresh: refreshSubscription } = useSubscription();

  const editDiaryId = route.params?.editDiaryId;
  const isEditMode = !!editDiaryId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEditMode);

  const contentAnim = useRef(new Animated.Value(0)).current;
  const textInputRef = useRef<TextInput>(null);

  // 수정 모드: 기존 일기 데이터 로드
  useEffect(() => {
    if (editDiaryId) {
      diaryApi.getDetail(editDiaryId)
        .then((diary) => {
          setTitle(diary.title);
          setContent(diary.content);
        })
        .catch(() => {
          Alert.alert(t('common.error'), t('diary.loadFailed'));
          navigation.goBack();
        })
        .finally(() => setLoadingEdit(false));
    }
  }, [editDiaryId]);

  useEffect(() => {
    Animated.spring(contentAnim, {
      toValue: 1,
      ...theme.springs.gentle,
      useNativeDriver: true,
    }).start();
  }, []);

  const getMoodColor = (mood: string) => {
    const colors: Record<string, string> = {
      happy: theme.moodColors.happy,
      calm: theme.moodColors.calm,
      sad: theme.moodColors.sad,
      anxious: theme.moodColors.anxious,
      angry: theme.moodColors.angry,
      grateful: theme.moodColors.grateful,
      tired: theme.moodColors.tired,
      excited: theme.moodColors.excited,
    };
    return colors[mood] || theme.colors.primary;
  };

  const handleSave = useCallback(async () => {
    if (!content.trim()) {
      Alert.alert(t('common.alert'), t('diary.contentRequired'));
      return;
    }
    setSaving(true);
    try {
      if (isEditMode && editDiaryId) {
        // 수정 모드: 일기 수정 후 AI 댓글 재생성
        await diaryApi.update(editDiaryId, {
          title: title.trim() || t('diary.untitled'),
          content: content.trim(),
        });
        // AI 댓글 재생성 (실패해도 수정은 완료)
        try {
          await diaryApi.retryAiComment(editDiaryId);
        } catch {
          // AI 재생성 실패는 무시 — 수정된 일기는 이미 저장됨
        }
        navigation.goBack();
      } else {
        // 새 일기 작성
        const today = new Date();
        const diaryDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const diary = await diaryApi.create({
          title: title.trim() || t('diary.untitled'),
          content: content.trim(),
          diaryDate,
        });
        // 쿼터 갱신
        refreshSubscription();
        // 저장 후 DiaryDetail로 이동 (replace로 WriteDiary를 스택에서 제거)
        navigation.replace('DiaryDetail', { diaryId: diary.id });
      }
    } catch (error: any) {
      if (error instanceof ApiError && error.status === 429) {
        // 쿼터 초과 → Paywall 이동
        navigation.dispatch(
          CommonActions.navigate({ name: 'Paywall' }),
        );
      } else {
        Alert.alert(isEditMode ? t('diary.editFailed') : t('diary.saveFailed'), error?.message || t('common.retry'));
      }
    } finally {
      setSaving(false);
    }
  }, [content, title, navigation, refreshSubscription, isEditMode, editDiaryId]);

  const today = new Date();
  const dateString = today.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <View style={[styles.container, {
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
    }]}>
      {/* Header */}
      <View style={[styles.header, {
        paddingHorizontal: theme.layout.screenPaddingH,
        borderBottomColor: theme.colors.borderSubtle,
      }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Text style={[theme.typography.bodyLarge, { color: theme.colors.textSecondary }]}>
            {t('diary.cancel')}
          </Text>
        </TouchableOpacity>

        <Text style={[theme.typography.labelMedium, { color: theme.colors.textTertiary }]}>
          {isEditMode ? t('diary.editDiary') : dateString}
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !content.trim() || loadingEdit}
          style={styles.headerButton}
        >
          <Text style={[
            theme.typography.labelLarge,
            {
              color: content.trim() && !loadingEdit ? theme.colors.primary : theme.colors.textDisabled,
            },
          ]}>
            {saving ? (isEditMode ? t('diary.editing') : t('diary.saving')) : (isEditMode ? t('diary.edit') : t('diary.save'))}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.screenPaddingH,
          paddingBottom: insets.bottom + theme.spacing['4xl'],
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{
          opacity: contentAnim,
          transform: [{
            translateY: contentAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [16, 0],
            }),
          }],
        }}>
          {/* Mood Selector (새 일기 작성 시에만) */}
          {!isEditMode && <View style={{ marginTop: theme.spacing.xl }}>
            <Text style={[
              theme.typography.labelMedium,
              { color: theme.colors.textTertiary, marginBottom: theme.spacing.md },
            ]}>
              {t('diary.todayMood')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moodRow}
            >
              {MOODS.map((mood) => {
                const isSelected = selectedMood === mood.key;
                return (
                  <TouchableOpacity
                    key={mood.key}
                    onPress={() => setSelectedMood(isSelected ? null : mood.key)}
                    style={[
                      styles.moodChip,
                      {
                        backgroundColor: isSelected
                          ? getMoodColor(mood.key) + '20'
                          : theme.colors.surfaceSecondary,
                        borderRadius: theme.borderRadius.full,
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: isSelected ? getMoodColor(mood.key) : 'transparent',
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text style={[
                      theme.typography.labelSmall,
                      {
                        color: isSelected
                          ? theme.colors.textPrimary
                          : theme.colors.textSecondary,
                      },
                    ]}>
                      {t(`diary.mood.${mood.key}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>}

          {/* Title */}
          <TextInput
            style={[
              theme.typography.headlineMedium,
              {
                color: theme.colors.textPrimary,
                marginTop: theme.spacing['2xl'],
                paddingVertical: theme.spacing.sm,
              },
            ]}
            placeholder={t('diary.titlePlaceholder')}
            placeholderTextColor={theme.colors.textDisabled}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          {/* Divider */}
          <View style={[styles.divider, {
            backgroundColor: theme.colors.border,
            marginVertical: theme.spacing.sm,
          }]} />

          {/* Content */}
          <TextInput
            ref={textInputRef}
            style={[
              theme.typography.bodyLarge,
              {
                color: theme.colors.textPrimary,
                minHeight: 300,
                textAlignVertical: 'top',
                paddingTop: theme.spacing.sm,
              },
            ]}
            placeholder={t('diary.contentPlaceholder')}
            placeholderTextColor={theme.colors.textDisabled}
            value={content}
            onChangeText={setContent}
            multiline
            scrollEnabled={false}
            autoFocus={!isEditMode}
          />
        </Animated.View>
      </ScrollView>

      {/* Footer: Character count */}
      {content.length > 0 && (
        <View style={[styles.footer, {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.borderSubtle,
          paddingBottom: insets.bottom + theme.spacing.sm,
          paddingHorizontal: theme.layout.screenPaddingH,
        }]}>
          <Text style={[
            theme.typography.caption,
            { color: theme.colors.textTertiary },
          ]}>
            {t('diary.charCount', { count: content.length })}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerButton: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  moodRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  moodEmoji: {
    fontSize: 18,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  footer: {
    paddingTop: 8,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
});
