/**
 * DiaryCanvasEditor V3 — Canvas-style diary writing experience
 *
 * - Canvas area with theme background
 * - Emotion sticker banner
 * - Photo zone (tap to add, tap X to remove)
 * - Freely draggable stickers via DraggableSticker
 * - Bottom toolbar (photo/theme/sticker/emotion)
 * - Save: text → photo upload → decoration save
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Animated, Image, Modal, Dimensions,
  ImageSourcePropType, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemeV2 } from '../design-system-v2';
import type { Theme } from '../design-system-v2';
import { diaryApiV3, diaryPhotoApi, diaryDecorationApi, emotionApi, ApiError } from '../api/client';
import { useSubscription } from '../contexts/SubscriptionContext';
import type { DiaryStackParamListV3, EmotionKey } from '../types';
import {
  EMOTION_COLORS, EMOTION_LABELS, EMOTION_KEYS,
  DIARY_THEMES,
} from '../constants/stickers';
import { EmotionStickerView } from './components/EmotionStickerView';
import { StickerPickerSheet } from './components/StickerPickerSheet';
import { DraggableSticker } from './components/DraggableSticker';
import { getStickerSource } from '../constants/stickerSources';

const { width: SCREEN_W } = Dimensions.get('window');

type Props = NativeStackScreenProps<DiaryStackParamListV3, 'WriteDiary'>;

interface PlacedSticker {
  id: string;
  code: string;
  source: ImageSourcePropType;
  x: number;
  y: number;
  size: number;
}

interface PhotoItem {
  uri: string;
  width: number;
  height: number;
}

let stickerIdCounter = 0;
function nextStickerId(): string {
  return `sticker_${Date.now()}_${++stickerIdCounter}`;
}

export default function DiaryCanvasEditorV3({ navigation, route }: Props) {
  const { theme } = useThemeV2();
  const insets = useSafeAreaInsets();
  const { refresh: refreshSubscription } = useSubscription();
  const s = makeStyles(theme);

  const initialEmotion = route.params?.selectedEmotion as EmotionKey | undefined;
  const secondaryTags = route.params?.secondaryTags as string[] | undefined;
  const editDiaryId = route.params?.editDiaryId;
  const isEditMode = !!editDiaryId;

  const [currentEmotion, setCurrentEmotion] = useState<EmotionKey | undefined>(initialEmotion);
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('note');
  const [saving, setSaving] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [showStickerSheet, setShowStickerSheet] = useState(false);
  const [canvasLayout, setCanvasLayout] = useState({ width: 0, height: 0 });
  const [editLoading, setEditLoading] = useState(isEditMode);

  // 수정 모드: 기존 일기 데이터 로드
  useEffect(() => {
    if (!editDiaryId) return;
    (async () => {
      try {
        const diary = await diaryApiV3.getDetailV3(editDiaryId);
        setTitle(diary.title || '');
        setContent(diary.content || '');
        setSelectedTheme(diary.theme || 'default');

        // 감정
        const emo = diary.emotion?.primaryEmotion
          || diary.emotion?.primarySticker?.category?.code;
        if (emo) setCurrentEmotion(emo as EmotionKey);

        // 사진 (서버 URL → PhotoItem)
        if (diary.photos && diary.photos.length > 0) {
          const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
          const SERVER = __DEV__ ? `http://${DEV_HOST}:8080` : 'https://api.mamuri.app';
          setPhotos(diary.photos.map((p: any) => ({
            uri: (p.cdnUrl || p.url || '').startsWith('http')
              ? (p.cdnUrl || p.url)
              : `${SERVER}${p.cdnUrl || p.url || ''}`,
            width: p.widthPx || 0,
            height: p.heightPx || 0,
            isRemote: true,
          })));
        }

        // 스티커
        if (diary.decorations && diary.decorations.length > 0) {
          const canvasW = Dimensions.get('window').width - 48;
          setPlacedStickers(diary.decorations.map((d: any) => ({
            id: nextStickerId(),
            code: d.assetCode || d.assetType || '',
            source: getStickerSource(d.assetCode || d.assetType || '') || getStickerSource('e_joy')!,
            x: (d.positionX || 0) * canvasW,
            y: (d.positionY || 0) * canvasW,  // 너비 기준 정규화
            size: Math.round(60 * (d.scale || 1)),
          })));
        }
      } catch (e: any) {
        console.warn('[DiaryCanvas] Edit load failed:', e?.message);
      } finally {
        setEditLoading(false);
      }
    })();
  }, [editDiaryId]);

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
        const asset = result.assets[0];
        setPhotos(prev => [...prev, {
          uri: asset.uri,
          width: asset.width || 0,
          height: asset.height || 0,
        }]);
      }
    } catch {
      Alert.alert('오류', '사진을 불러올 수 없습니다.');
    }
  }, [photos.length]);

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleStickerSelect = useCallback((sticker: { code: string; category: string }) => {
    const source = getStickerSource(sticker.code);
    if (!source) return;

    const canvasW = canvasLayout.width || SCREEN_W - 48;
    const canvasH = canvasLayout.height || 400;

    setPlacedStickers(prev => [...prev, {
      id: nextStickerId(),
      code: sticker.code,
      source,
      x: canvasW / 2 - 30,
      y: canvasH / 2 - 30,
      size: 60,
    }]);
    setShowStickerSheet(false);
  }, [canvasLayout]);

  const handleStickerPositionChange = useCallback((id: string, x: number, y: number) => {
    setPlacedStickers(prev =>
      prev.map(s => s.id === id ? { ...s, x, y } : s)
    );
  }, []);

  const handleStickerDelete = useCallback((id: string) => {
    setPlacedStickers(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleStickerResize = useCallback((id: string, newSize: number) => {
    setPlacedStickers(prev => prev.map(s => s.id === id ? { ...s, size: newSize } : s));
  }, []);

  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (!content.trim() && photos.length === 0 && placedStickers.length === 0) {
      Alert.alert('알림', '텍스트, 사진, 또는 스티커를 추가해주세요.');
      return;
    }
    setSaving(true);
    try {
      const today = new Date();
      const diaryDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // 1. 일기 텍스트 저장
      const diary = await diaryApiV3.createV3({
        title: title.trim() || '무제',
        content: content.trim(),
        diaryDate,
        diaryType: photos.length > 0 ? 'MIXED' : 'TEXT',
        primaryEmotion: currentEmotion,
        secondaryEmotions: secondaryTags || [],
        emotionScore: 3,
        theme: selectedTheme !== 'default' ? selectedTheme : undefined,
      });

      // 2. 사진 업로드 (순차적)
      for (const photo of photos) {
        try {
          await diaryPhotoApi.upload(diary.id, photo.uri);
        } catch (uploadErr: any) {
          console.warn('[DiaryCanvas] Photo upload failed:', uploadErr?.message || uploadErr);
        }
      }

      // 3. 스티커 배치 저장
      if (placedStickers.length > 0) {
        const canvasW = canvasLayout.width || SCREEN_W - 48;
        const canvasH = canvasLayout.height || 400;

        const DEFAULT_STICKER_SIZE = 60;
        // 너비 기준으로만 정규화 (X, Y 모두) — 높이는 콘텐츠에 따라 변하므로
        const decorations = placedStickers.map((sticker, idx) => ({
          assetType: sticker.code,
          positionX: canvasW > 0 ? sticker.x / canvasW : 0,
          positionY: canvasW > 0 ? sticker.y / canvasW : 0,
          scale: sticker.size / DEFAULT_STICKER_SIZE,
          rotation: 0,
          zIndex: idx,
        }));

        try {
          await diaryDecorationApi.save(diary.id, decorations);
        } catch (decoErr: any) {
          console.warn('[DiaryCanvas] Decoration save failed:', decoErr?.message || decoErr);
        }
      }

      refreshSubscription();
      // replace editor with detail — back from detail goes to list
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
  }, [content, title, photos, placedStickers, currentEmotion, secondaryTags, selectedTheme, canvasLayout, navigation, refreshSubscription]);

  const themeConfig = DIARY_THEMES.find(t => t.key === selectedTheme) || DIARY_THEMES[0];
  const themeColors: Record<string, string> = { night: '#1A1A2E', warm: '#FFF8F0', nature: '#F0F7F0', note: '#FFFDF5', grid: '#F8FBF8' };
  const bgColor = themeColors[selectedTheme] || theme.colors.background;
  const textColor = selectedTheme === 'night' ? '#EDEDF0' : theme.colors.textPrimary;
  const subtleColor = selectedTheme === 'night' ? '#686880' : theme.colors.textDisabled;
  const borderColor = selectedTheme === 'night' ? '#2A2A3A' : theme.colors.borderSubtle;

  return (
    <View style={[s.root, { backgroundColor: bgColor, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Text style={[s.headerBtnText, { color: textColor }]}>취소</Text>
        </TouchableOpacity>
        <Text style={[s.headerDate, { color: selectedTheme === 'night' ? '#9898AC' : theme.colors.textTertiary }]}>
          {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving || (!content.trim() && photos.length === 0 && placedStickers.length === 0)} style={s.headerBtn}>
          <Text style={[s.headerBtnText, {
            color: (content.trim() || photos.length > 0 || placedStickers.length > 0) ? theme.colors.primary : theme.colors.textDisabled,
          }]}>
            {saving ? '저장 중...' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Canvas Area */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setSelectedStickerId(null)}
            style={[s.canvas, { backgroundColor: bgColor }]}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setCanvasLayout({ width, height });
            }}
          >
            <Animated.View style={{
              opacity: contentAnim,
              transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }}>
              {/* Emotion Banner — tap to change */}
              <TouchableOpacity
                onPress={() => setShowEmotionPicker(true)}
                style={[
                  s.moodBanner,
                  {
                    backgroundColor: currentEmotion
                      ? EMOTION_COLORS[currentEmotion] + '15'
                      : theme.colors.surfaceSecondary,
                  },
                ]}
                activeOpacity={0.7}
              >
                {currentEmotion ? (
                  <>
                    <EmotionStickerView emotionKey={currentEmotion} size="small" />
                    <Text style={[s.moodLabel, { color: EMOTION_COLORS[currentEmotion] }]}>
                      {EMOTION_LABELS[currentEmotion]}
                    </Text>
                    {secondaryTags && secondaryTags.length > 0 && (
                      <Text style={[s.moodTags, { color: EMOTION_COLORS[currentEmotion] + 'AA' }]}>
                        {secondaryTags.join(' · ')}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={[s.moodLabel, { color: theme.colors.textTertiary }]}>
                    오늘 기분을 선택해주세요
                  </Text>
                )}
                <Text style={[s.moodChangeHint, { color: theme.colors.textDisabled }]}>
                  {currentEmotion ? '변경' : '선택'}
                </Text>
              </TouchableOpacity>

              {/* Photo Zone */}
              {photos.length > 0 && (
                <View style={s.photoSection}>
                  {photos.map((photo, i) => (
                    <View key={i} style={s.photoWrapper}>
                      <Image
                        source={{ uri: photo.uri }}
                        style={s.photoImage}
                        resizeMode="cover"
                      />
                      <TouchableOpacity style={s.photoRemove} onPress={() => handleRemovePhoto(i)}>
                        <Text style={s.photoRemoveText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Title */}
              <TextInput
                style={[s.titleInput, { color: textColor }]}
                placeholder="제목 (선택)"
                placeholderTextColor={subtleColor}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />

              {/* Divider */}
              <View style={[s.divider, { backgroundColor: borderColor }]} />

              {/* Content with lined background */}
              <View style={s.contentArea}>
                {(selectedTheme === 'note' || selectedTheme === 'warm') && (
                  <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <View key={i} style={{ height: 28, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: selectedTheme === 'note' ? '#E8E0D0' : '#F0E8E0' }} />
                    ))}
                  </View>
                )}
                {(selectedTheme === 'grid' || selectedTheme === 'nature') && (
                  <View style={[StyleSheet.absoluteFill, { flexDirection: 'column' }]} pointerEvents="none">
                    {Array.from({ length: 40 }).map((_, row) => (
                      <View key={row} style={{ flexDirection: 'row', height: 28 }}>
                        {Array.from({ length: 12 }).map((_, col) => (
                          <View key={col} style={{ flex: 1, borderWidth: StyleSheet.hairlineWidth, borderColor: selectedTheme === 'grid' ? '#D0D8D0' : '#D8E8D8' }} />
                        ))}
                      </View>
                    ))}
                  </View>
                )}
                <TextInput
                  ref={textInputRef}
                  style={[s.contentInput, { color: textColor }]}
                  placeholder="오늘 어떤 하루였나요?"
                  placeholderTextColor={subtleColor}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  scrollEnabled={false}
                  autoFocus={!isEditMode}
                />
              </View>

            {/* Sticker Canvas — separate zone below text for free placement */}
            {placedStickers.length > 0 && (
              <View style={s.stickerCanvas}>
                <Text style={[s.stickerCanvasLabel, { color: theme.colors.textDisabled }]}>
                  스티커 영역 — 자유롭게 배치하세요
                </Text>
                {placedStickers.map((sticker) => (
                  <DraggableSticker
                    key={sticker.id}
                    id={sticker.id}
                    stickerCode={sticker.code}
                    stickerSource={sticker.source}
                    initialX={sticker.x}
                    initialY={sticker.y}
                    size={sticker.size}
                    onPositionChange={handleStickerPositionChange}
                    onDelete={handleStickerDelete}
                    onSizeChange={handleStickerResize}
                    selected={sticker.id === selectedStickerId}
                    onSelect={setSelectedStickerId}
                    editable
                  />
                ))}
              </View>
            )}
            </Animated.View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Toolbar */}
      <View style={[s.toolbar, {
        backgroundColor: bgColor,
        borderTopColor: borderColor,
        paddingBottom: insets.bottom + 8,
      }]}>
        <TouchableOpacity style={s.toolBtn} onPress={handlePickPhoto}>
          <View style={s.toolIconView}>
            <View style={{ width: 18, height: 14, borderRadius: 3, borderWidth: 1.5, borderColor: theme.colors.textTertiary, alignItems: 'center', justifyContent: 'flex-end' }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.textTertiary, position: 'absolute', top: 1.5, right: 2.5 }} />
              <View style={{ width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderBottomWidth: 5, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: theme.colors.textTertiary, marginBottom: 1 }} />
            </View>
          </View>
          <Text style={[s.toolLabel, { color: theme.colors.textTertiary }]}>사진</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.toolBtn} onPress={() => setShowThemeSheet(true)}>
          <View style={s.toolIconView}>
            <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: theme.colors.textTertiary }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFD166', position: 'absolute', top: 1.5, left: 4 }} />
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#83C9A8', position: 'absolute', bottom: 1.5, left: 1.5 }} />
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#7BA7D9', position: 'absolute', bottom: 1.5, right: 1.5 }} />
            </View>
          </View>
          <Text style={[s.toolLabel, { color: theme.colors.textTertiary }]}>테마</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.toolBtn} onPress={() => setShowStickerSheet(true)}>
          <View style={s.toolIconView}>
            <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ position: 'absolute', width: 14, height: 2, backgroundColor: theme.colors.textTertiary, borderRadius: 1 }} />
              <View style={{ position: 'absolute', width: 2, height: 14, backgroundColor: theme.colors.textTertiary, borderRadius: 1 }} />
              <View style={{ position: 'absolute', width: 10, height: 2, backgroundColor: theme.colors.textTertiary, borderRadius: 1, transform: [{ rotate: '45deg' }] }} />
              <View style={{ position: 'absolute', width: 10, height: 2, backgroundColor: theme.colors.textTertiary, borderRadius: 1, transform: [{ rotate: '-45deg' }] }} />
            </View>
          </View>
          <Text style={[s.toolLabel, { color: theme.colors.textTertiary }]}>스티커</Text>
        </TouchableOpacity>

        {content.length > 0 && (
          <Text style={[s.charCount, { color: theme.colors.textTertiary }]}>
            {content.length}자
          </Text>
        )}
      </View>

      {/* Sticker Picker Sheet */}
      <StickerPickerSheet
        visible={showStickerSheet}
        onClose={() => setShowStickerSheet(false)}
        onSelect={handleStickerSelect}
      />

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

      {/* Emotion Picker Modal */}
      <Modal visible={showEmotionPicker} transparent animationType="slide">
        <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={() => setShowEmotionPicker(false)}>
          <View style={[s.sheetContent, { backgroundColor: theme.colors.surface, paddingBottom: insets.bottom + 16 }]}>
            <Text style={[s.sheetTitle, { color: theme.colors.textPrimary }]}>오늘의 기분</Text>
            <View style={s.emotionGrid}>
              {EMOTION_KEYS.map((key) => {
                const isSelected = currentEmotion === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      s.emotionGridItem,
                      {
                        borderColor: isSelected ? EMOTION_COLORS[key] : theme.colors.border,
                        backgroundColor: isSelected ? EMOTION_COLORS[key] + '15' : 'transparent',
                      },
                    ]}
                    onPress={() => { setCurrentEmotion(key); setShowEmotionPicker(false); }}
                  >
                    <EmotionStickerView emotionKey={key} size="small" />
                    <Text style={[s.emotionGridLabel, { color: isSelected ? EMOTION_COLORS[key] : theme.colors.textSecondary }]}>
                      {EMOTION_LABELS[key]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
      borderBottomWidth: 1,
    },
    headerBtn: { height: 44, justifyContent: 'center', paddingHorizontal: 4 },
    headerBtnText: { ...t.typography.bodyLarge, fontWeight: '500' },
    headerDate: { ...t.typography.labelMedium },

    // Canvas
    canvas: {
      minHeight: 400,
      paddingHorizontal: t.layout.screenPaddingH,
      position: 'relative',
    },
    stickerCanvas: {
      minHeight: 200,
      marginTop: t.spacing.xl,
      position: 'relative',
      borderWidth: 1,
      borderColor: t.colors.borderSubtle,
      borderStyle: 'dashed',
      borderRadius: t.borderRadius.lg,
      padding: t.spacing.md,
      overflow: 'visible' as const,
    },
    stickerCanvasLabel: {
      fontSize: 11,
      textAlign: 'center',
      marginBottom: t.spacing.sm,
    },

    // MoodBanner
    moodBanner: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
      borderRadius: t.borderRadius.lg, marginTop: t.spacing.xl,
      gap: 8,
    },
    moodLabel: { fontSize: 15, fontWeight: '700' },
    moodTags: { fontSize: 12, marginLeft: 4, flex: 1 },
    moodChangeHint: { fontSize: 12, marginLeft: 'auto' },

    // Photos
    photoSection: { marginTop: t.spacing.xl, gap: t.spacing.md },
    photoWrapper: { position: 'relative' },
    photoImage: { width: '100%', height: 200, borderRadius: 12 },
    photoRemove: {
      position: 'absolute', top: 8, right: 8,
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center', justifyContent: 'center',
    },
    photoRemoveText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

    // Inputs
    titleInput: {
      ...t.typography.headlineMedium, marginTop: t.spacing.xl,
      paddingVertical: t.spacing.sm,
    },
    divider: { height: 1, width: '100%', marginVertical: t.spacing.sm },
    contentArea: {
      position: 'relative',
      minHeight: 280,
    },
    contentInput: {
      ...t.typography.bodyLarge, minHeight: 280,
      textAlignVertical: 'top',
      paddingTop: 0, // 줄 패턴 첫 번째 줄에 정확히 맞춤
      lineHeight: 28,
      fontSize: 15,
    },

    // Toolbar
    toolbar: {
      flexDirection: 'row', alignItems: 'center',
      paddingTop: 10, paddingHorizontal: t.layout.screenPaddingH,
      borderTopWidth: 1, gap: t.spacing.xl,
    },
    toolBtn: { alignItems: 'center', gap: 2 },
    toolIconView: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
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

    // Emotion picker grid
    emotionGrid: {
      flexDirection: 'row', flexWrap: 'wrap',
      justifyContent: 'center', gap: 12,
    },
    emotionGridItem: {
      alignItems: 'center', justifyContent: 'center',
      width: 72, paddingVertical: 12,
      borderRadius: t.borderRadius.lg, borderWidth: 1.5,
      gap: 6,
    },
    emotionGridLabel: { fontSize: 12, fontWeight: '600' },
  });
}
