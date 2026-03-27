/**
 * DiaryExpressiveEditor V3 — Rich diary writing experience
 *
 * - MoodBanner (selected emotion)
 * - PhotoZone (up to 3 photos via expo-image-picker)
 * - ThemeSelector (4 themes)
 * - Title + body input
 * - Bottom toolbar (photo/theme/sticker icons)
 * - Deco sticker overlays (3 fixed positions)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Animated, Image, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemeV2 } from '../design-system-v2';
import type { Theme } from '../design-system-v2';
import { diaryApiV3, emotionApi, ApiError } from '../api/client';
import { useSubscription } from '../contexts/SubscriptionContext';
import type { DiaryStackParamListV3, EmotionKey } from '../types';
import {
  EMOTION_COLORS, EMOTION_LABELS, EMOTION_ICONS,
  DIARY_THEMES, EMOTION_STICKER_IMAGES,
} from '../constants/stickers';

type Props = NativeStackScreenProps<DiaryStackParamListV3, 'WriteDiary'>;

export default function DiaryExpressiveEditorV3({ navigation, route }: Props) {
  const { theme } = useThemeV2();
  const insets = useSafeAreaInsets();
  const { refresh: refreshSubscription } = useSubscription();
  const s = makeStyles(theme);

  const selectedEmotion = route.params?.selectedEmotion as EmotionKey | undefined;
  const secondaryTags = route.params?.secondaryTags as string[] | undefined;
  const editDiaryId = route.params?.editDiaryId;
  const isEditMode = !!editDiaryId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('default');
  const [saving, setSaving] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);

  const contentAnim = useRef(new Animated.Value(0)).current;
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.spring(contentAnim, {
      toValue: 1,
      tension: 50, friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePickPhoto = useCallback(async () => {
    if (photos.length >= 3) {
      Alert.alert('알림', '사진은 최대 3장까지 첨부할 수 있어요.');
      return;
    }
    try {
      const ImagePicker = require('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch {
      Alert.alert('오류', '사진을 불러올 수 없습니다.');
    }
  }, [photos.length]);

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = useCallback(async () => {
    if (!content.trim()) {
      Alert.alert('알림', '내용을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const today = new Date();
      const diaryDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const diary = await diaryApiV3.createV3({
        title: title.trim() || '무제',
        content: content.trim(),
        diaryDate,
        diaryType: photos.length > 0 ? 'MIXED' : 'TEXT',
        primaryEmotion: selectedEmotion,
        secondaryEmotions: secondaryTags || [],
        emotionScore: 3,
        theme: selectedTheme !== 'default' ? selectedTheme : undefined,
      });

      refreshSubscription();
      navigation.replace('DiaryDetail', { diaryId: diary.id });
    } catch (error: any) {
      if (error instanceof ApiError && error.status === 429) {
        Alert.alert('알림', error.message || '잠시 후 다시 시도해주세요.');
      } else {
        Alert.alert('저장 실패', error?.message || '잠시 후 다시 시도해주세요.');
      }
    } finally {
      setSaving(false);
    }
  }, [content, title, photos, selectedEmotion, secondaryTags, selectedTheme, navigation, refreshSubscription]);

  const themeConfig = DIARY_THEMES.find(t => t.key === selectedTheme) || DIARY_THEMES[0];
  const bgColor = selectedTheme === 'night' ? '#1A1A2E' : theme.colors.background;
  const textColor = selectedTheme === 'night' ? '#EDEDF0' : theme.colors.textPrimary;

  return (
    <View style={[s.root, { backgroundColor: bgColor, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Text style={[s.headerBtnText, { color: textColor }]}>취소</Text>
        </TouchableOpacity>
        <Text style={[s.headerDate, { color: selectedTheme === 'night' ? '#9898AC' : theme.colors.textTertiary }]}>
          {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving || !content.trim()} style={s.headerBtn}>
          <Text style={[s.headerBtnText, {
            color: content.trim() ? theme.colors.primary : theme.colors.textDisabled,
          }]}>
            {saving ? '저장 중...' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 80 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{
          opacity: contentAnim,
          transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        }}>
          {/* MoodBanner */}
          {selectedEmotion && (
            <View style={[s.moodBanner, { backgroundColor: EMOTION_COLORS[selectedEmotion] + '15' }]}>
              <Image source={EMOTION_STICKER_IMAGES[selectedEmotion]} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
              <Text style={[s.moodLabel, { color: EMOTION_COLORS[selectedEmotion] }]}>
                {EMOTION_LABELS[selectedEmotion]}
              </Text>
              {secondaryTags && secondaryTags.length > 0 && (
                <Text style={[s.moodTags, { color: EMOTION_COLORS[selectedEmotion] + 'AA' }]}>
                  {secondaryTags.join(' · ')}
                </Text>
              )}
            </View>
          )}

          {/* PhotoZone */}
          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photoZone} contentContainerStyle={s.photoRow}>
              {photos.map((uri, i) => (
                <View key={i} style={s.photoWrapper}>
                  <Image source={{ uri }} style={s.photoImage} />
                  <TouchableOpacity style={s.photoRemove} onPress={() => handleRemovePhoto(i)}>
                    <Text style={s.photoRemoveText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* ThemeSelector (horizontal chips) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.themeRow}>
            {DIARY_THEMES.map((t) => {
              const isActive = selectedTheme === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    s.themeChip,
                    {
                      backgroundColor: isActive ? theme.colors.primary + '15' : theme.colors.surfaceSecondary,
                      borderWidth: isActive ? 1.5 : 0,
                      borderColor: isActive ? theme.colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => setSelectedTheme(t.key)}
                  activeOpacity={0.7}
                >
                  <View style={[s.themeColorDot, { backgroundColor: t.color, borderWidth: 1, borderColor: theme.colors.border }]} />
                  <Text style={[s.themeLabel, { color: isActive ? theme.colors.primary : theme.colors.textSecondary }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Title */}
          <TextInput
            style={[s.titleInput, { color: textColor }]}
            placeholder="제목 (선택)"
            placeholderTextColor={selectedTheme === 'night' ? '#686880' : theme.colors.textDisabled}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          {/* Divider */}
          <View style={[s.divider, { backgroundColor: selectedTheme === 'night' ? '#2A2A3A' : theme.colors.border }]} />

          {/* Content */}
          <TextInput
            ref={textInputRef}
            style={[s.contentInput, { color: textColor }]}
            placeholder="오늘 어떤 일이 있었나요?"
            placeholderTextColor={selectedTheme === 'night' ? '#686880' : theme.colors.textDisabled}
            value={content}
            onChangeText={setContent}
            multiline
            scrollEnabled={false}
            autoFocus={!isEditMode}
          />

          {/* Deco Sticker Overlays (fixed position placeholders) */}
          {selectedEmotion && (
            <>
              <View style={s.decoTopLeft}>
                <Text style={s.decoEmoji}>{EMOTION_ICONS[selectedEmotion]}</Text>
              </View>
              <View style={s.decoTopRight}>
                <Text style={[s.decoEmoji, { opacity: 0.4 }]}>{EMOTION_ICONS[selectedEmotion]}</Text>
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom Toolbar */}
      <View style={[s.toolbar, {
        backgroundColor: bgColor,
        borderTopColor: selectedTheme === 'night' ? '#2A2A3A' : theme.colors.borderSubtle,
        paddingBottom: insets.bottom + 8,
      }]}>
        <TouchableOpacity style={s.toolBtn} onPress={handlePickPhoto}>
          <Text style={s.toolIcon}>📷</Text>
          <Text style={[s.toolLabel, { color: theme.colors.textTertiary }]}>사진</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.toolBtn} onPress={() => setShowThemeSheet(true)}>
          <Text style={s.toolIcon}>🎨</Text>
          <Text style={[s.toolLabel, { color: theme.colors.textTertiary }]}>테마</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.toolBtn} disabled>
          <Text style={s.toolIcon}>✨</Text>
          <Text style={[s.toolLabel, { color: theme.colors.textTertiary }]}>스티커</Text>
        </TouchableOpacity>

        {content.length > 0 && (
          <Text style={[s.charCount, { color: theme.colors.textTertiary }]}>
            {content.length}자
          </Text>
        )}
      </View>

      {/* Theme Sheet Modal */}
      <Modal visible={showThemeSheet} transparent animationType="slide">
        <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={() => setShowThemeSheet(false)}>
          <View style={[s.sheetContent, { backgroundColor: theme.colors.surface, paddingBottom: insets.bottom + 16 }]}>
            <Text style={[s.sheetTitle, { color: theme.colors.textPrimary }]}>테마 선택</Text>
            {DIARY_THEMES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[s.sheetOption, { borderColor: selectedTheme === t.key ? theme.colors.primary : theme.colors.border }]}
                onPress={() => { setSelectedTheme(t.key); setShowThemeSheet(false); }}
              >
                <View style={[s.sheetDot, { backgroundColor: t.color, borderWidth: 1, borderColor: theme.colors.border }]} />
                <Text style={[s.sheetOptionText, { color: theme.colors.textPrimary }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1 },

    // Header
    header: {
      height: 56, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', paddingHorizontal: t.layout.screenPaddingH,
      borderBottomWidth: 1, borderBottomColor: t.colors.borderSubtle,
    },
    headerBtn: { height: 44, justifyContent: 'center', paddingHorizontal: 4 },
    headerBtnText: { ...t.typography.bodyLarge, fontWeight: '500' },
    headerDate: { ...t.typography.labelMedium },

    scroll: { paddingHorizontal: t.layout.screenPaddingH },

    // MoodBanner
    moodBanner: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
      borderRadius: t.borderRadius.lg, marginTop: t.spacing.xl,
      gap: 8,
    },
    moodIcon: { fontSize: 24 },
    moodLabel: { fontSize: 15, fontWeight: '700' },
    moodTags: { fontSize: 12, marginLeft: 4 },

    // Photos
    photoZone: { marginTop: t.spacing.xl },
    photoRow: { gap: t.spacing.md },
    photoWrapper: { position: 'relative' },
    photoImage: { width: 120, height: 120, borderRadius: 16 },
    photoRemove: {
      position: 'absolute', top: 4, right: 4,
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center', justifyContent: 'center',
    },
    photoRemoveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

    // Theme
    themeRow: { marginTop: t.spacing.xl, marginBottom: t.spacing.md },
    themeChip: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: t.borderRadius.full, marginRight: 8, gap: 6,
    },
    themeColorDot: { width: 14, height: 14, borderRadius: 7 },
    themeLabel: { fontSize: 12, fontWeight: '500' },

    // Inputs
    titleInput: {
      ...t.typography.headlineMedium, marginTop: t.spacing.xl,
      paddingVertical: t.spacing.sm,
    },
    divider: { height: 1, width: '100%', marginVertical: t.spacing.sm },
    contentInput: {
      ...t.typography.bodyLarge, minHeight: 250,
      textAlignVertical: 'top', paddingTop: t.spacing.sm,
    },

    // Deco
    decoTopLeft: { position: 'absolute', top: 8, left: -8, opacity: 0.15 },
    decoTopRight: { position: 'absolute', top: 8, right: -8, opacity: 0.15 },
    decoEmoji: { fontSize: 40 },

    // Toolbar
    toolbar: {
      flexDirection: 'row', alignItems: 'center',
      paddingTop: 10, paddingHorizontal: t.layout.screenPaddingH,
      borderTopWidth: 1, gap: t.spacing.xl,
    },
    toolBtn: { alignItems: 'center', gap: 2 },
    toolIcon: { fontSize: 20 },
    toolLabel: { fontSize: 10 },
    charCount: { ...t.typography.caption, marginLeft: 'auto' },

    // Sheet
    sheetOverlay: {
      flex: 1, justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheetContent: {
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      padding: t.spacing['2xl'],
    },
    sheetTitle: {
      ...t.typography.titleLarge, fontWeight: '700',
      marginBottom: t.spacing.xl, textAlign: 'center',
    },
    sheetOption: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 14, paddingHorizontal: 16,
      borderRadius: t.borderRadius.md, borderWidth: 1, marginBottom: 8,
      gap: 12,
    },
    sheetDot: { width: 20, height: 20, borderRadius: 10 },
    sheetOptionText: { fontSize: 15, fontWeight: '500' },
  });
}
