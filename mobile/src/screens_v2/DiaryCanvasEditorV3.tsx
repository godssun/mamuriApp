/**
 * DiaryCanvasEditor V3 — 2-Layer Canvas diary editor
 *
 * Canvas architecture:
 *   Background Layer: notebook/grid pattern (absolute, full fill)
 *   Text Layer: TextInput (flow, line-aligned)
 *   Object Layer: photos + stickers via CanvasObject (absolute, free placement)
 *
 * - Emotion banner (tap to change)
 * - Bottom toolbar (photo/theme/sticker)
 * - Save: text -> photo upload -> decoration save (unified coordinates)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Animated, Image, Modal, Dimensions,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  colors, typography, shadows, spacing, borderRadius, layout,
  fontFamily, PaperBackground,
} from '../design-system-v3';
import { diaryApiV3, diaryPhotoApi, diaryDecorationApi, emotionApi, ApiError } from '../api/client';
import { useSubscription } from '../contexts/SubscriptionContext';
import type { DiaryStackParamListV3, EmotionKey } from '../types';
import {
  EMOTION_COLORS, EMOTION_LABELS, EMOTION_KEYS,
  DIARY_THEMES,
} from '../constants/stickers';
import { EmotionStickerView } from './components/EmotionStickerView';
import { StickerPickerSheet } from './components/StickerPickerSheet';
import { DiaryPageRenderer, CANVAS_PADDING_H } from './components/DiaryPageRenderer';
import type { CanvasObjectData } from './components/CanvasObject';
import { getStickerSource } from '../constants/stickerSources';

const { width: SCREEN_W } = Dimensions.get('window');

type Props = NativeStackScreenProps<DiaryStackParamListV3, 'WriteDiary'>;

let objectIdCounter = 0;
function nextId(): string {
  return `obj_${Date.now()}_${++objectIdCounter}`;
}


export default function DiaryCanvasEditorV3({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const s = styles;

  const initialEmotion = route.params?.selectedEmotion as EmotionKey | undefined;
  const secondaryTags = route.params?.secondaryTags as string[] | undefined;
  const editDiaryId = route.params?.editDiaryId;
  const isEditMode = !!editDiaryId;

  // ── Core state ──
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [objects, setObjects] = useState<CanvasObjectData[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>('note');
  const [currentEmotion, setCurrentEmotion] = useState<EmotionKey | undefined>(initialEmotion);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // ── UI state ──
  const [saving, setSaving] = useState(false);
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [showStickerSheet, setShowStickerSheet] = useState(false);
  const [editLoading, setEditLoading] = useState(isEditMode);

  const contentAnim = useRef(new Animated.Value(0)).current;
  const textInputRef = useRef<TextInput>(null);

  // ── Edit mode: load existing diary ──
  useEffect(() => {
    if (!editDiaryId) return;
    (async () => {
      try {
        const diary = await diaryApiV3.getDetailV3(editDiaryId);
        setTitle(diary.title || '');
        setContent(diary.content || '');
        setSelectedTheme(diary.theme || 'note');

        const emo = diary.emotion?.primaryEmotion
          || diary.emotion?.primarySticker?.category?.code;
        if (emo) setCurrentEmotion(emo as EmotionKey);

        const canvasW = Dimensions.get('window').width - (CANVAS_PADDING_H * 2);
        const loadedObjects: CanvasObjectData[] = [];

        // Photos — use photo API coordinates
        if (diary.photos && diary.photos.length > 0) {
          const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
          const SERVER = __DEV__ ? `http://${DEV_HOST}:8080` : 'https://api.mamuri.app';
          diary.photos.forEach((p: any, i: number) => {
            const uri = (p.cdnUrl || p.url || '').startsWith('http')
              ? (p.cdnUrl || p.url)
              : `${SERVER}${p.cdnUrl || p.url || ''}`;
            const photoW = p.displayWidth || Math.min(p.widthPx || 200, canvasW * 0.8);
            const photoH = p.displayHeight || (p.heightPx
              ? photoW * (p.heightPx / (p.widthPx || 1))
              : photoW * 0.75);
            loadedObjects.push({
              id: nextId(),
              type: 'photo',
              x: p.positionX != null ? p.positionX * canvasW : (canvasW - photoW) / 2,
              y: p.positionY != null ? p.positionY * canvasW : 20 + i * (photoH + 16),
              width: photoW,
              height: photoH,
              rotation: p.rotation || 0,
              zIndex: p.zIndex ?? i,
              photoUri: uri,
            });
          });
        }

        // Stickers only from decorations
        if (diary.decorations && diary.decorations.length > 0) {
          diary.decorations.forEach((d: any) => {
            const code = d.assetCode || d.assetType || '';
            const source = getStickerSource(code);
            if (!source) return;
            const stickerSize = Math.round(60 * (d.scale || 1));
            loadedObjects.push({
              id: nextId(),
              type: 'sticker',
              x: (d.positionX || 0) * canvasW,
              y: (d.positionY || 0) * canvasW,
              width: stickerSize,
              height: stickerSize,
              rotation: d.rotation || 0,
              zIndex: d.zIndex || loadedObjects.length,
              stickerCode: code,
              stickerSource: source,
            });
          });
        }

        setObjects(loadedObjects);
      } catch (e: any) {
        console.warn('[DiaryCanvas] Edit load failed:', e?.message);
      } finally {
        setEditLoading(false);
      }
    })();
  }, [editDiaryId]);

  useEffect(() => {
    Animated.spring(contentAnim, {
      toValue: 1,
      tension: 50, friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  // ── Canvas measurement ──
  const handleCanvasLayout = useCallback((e: any) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize({ width, height });
  }, []);

  // ── Photo add ──
  const handleAddPhoto = useCallback(async () => {
    const photoCount = objects.filter(o => o.type === 'photo').length;
    if (photoCount >= 3) {
      Alert.alert('알림', '사진은 최대 3장까지 첨부할 수 있어요.');
      return;
    }
    try {
      const ImagePicker = require('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const canvasW = canvasSize.width || SCREEN_W - (CANVAS_PADDING_H * 2);
        const photoW = Math.min(asset.width || 200, canvasW * 0.8);
        const photoH = photoW * ((asset.height || 150) / (asset.width || 200));

        setObjects(prev => [...prev, {
          id: nextId(),
          type: 'photo' as const,
          x: (canvasW - photoW) / 2,
          y: 20,
          width: photoW,
          height: photoH,
          rotation: 0,
          zIndex: prev.length,
          photoUri: asset.uri,
        }]);
      }
    } catch {
      Alert.alert('오류', '사진을 불러올 수 없습니다.');
    }
  }, [objects, canvasSize]);

  // ── Sticker add ──
  const handleStickerSelect = useCallback((sticker: { code: string; category: string }) => {
    const source = getStickerSource(sticker.code);
    if (!source) return;

    const canvasW = canvasSize.width || SCREEN_W - (CANVAS_PADDING_H * 2);
    setObjects(prev => [...prev, {
      id: nextId(),
      type: 'sticker' as const,
      x: canvasW / 2 - 30,
      y: 100,
      width: 60,
      height: 60,
      rotation: 0,
      zIndex: prev.length,
      stickerCode: sticker.code,
      stickerSource: source,
    }]);
    setShowStickerSheet(false);
  }, [canvasSize]);

  // ── Object manipulation ──
  const handleMove = useCallback((id: string, x: number, y: number) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, x, y } : o));
  }, []);

  const handleResize = useCallback((id: string, w: number, h: number) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, width: w, height: h } : o));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setObjects(prev => prev.filter(o => o.id !== id));
    setSelectedObjectId(null);
  }, []);

  const handleRotate = useCallback((id: string, deg: number) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, rotation: deg } : o));
  }, []);

  const handleBringForward = useCallback((id: string) => {
    setObjects(prev => {
      const target = prev.find(o => o.id === id);
      if (!target) return prev;
      const above = prev
        .filter(o => o.id !== id && o.zIndex > target.zIndex)
        .sort((a, b) => a.zIndex - b.zIndex);
      if (above.length === 0) return prev;
      const swapWith = above[0];
      return prev.map(o => {
        if (o.id === id) return { ...o, zIndex: swapWith.zIndex };
        if (o.id === swapWith.id) return { ...o, zIndex: target.zIndex };
        return o;
      });
    });
  }, []);

  const handleSendBackward = useCallback((id: string) => {
    setObjects(prev => {
      const target = prev.find(o => o.id === id);
      if (!target) return prev;
      const below = prev
        .filter(o => o.id !== id && o.zIndex < target.zIndex)
        .sort((a, b) => b.zIndex - a.zIndex);
      if (below.length === 0) return prev;
      const swapWith = below[0];
      return prev.map(o => {
        if (o.id === id) return { ...o, zIndex: swapWith.zIndex };
        if (o.id === swapWith.id) return { ...o, zIndex: target.zIndex };
        return o;
      });
    });
  }, []);

  // ── Save ──
  const handleSave = useCallback(async () => {
    const hasPhotos = objects.some(o => o.type === 'photo');
    if (!content.trim() && objects.length === 0) {
      Alert.alert('알림', '텍스트, 사진, 또는 스티커를 추가해주세요.');
      return;
    }
    setSaving(true);
    try {
      const today = new Date();
      const diaryDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // 1. Save diary text
      const diary = await diaryApiV3.createV3({
        title: title.trim() || '무제',
        content: content.trim(),
        diaryDate,
        diaryType: hasPhotos ? 'MIXED' : 'TEXT',
        primaryEmotion: currentEmotion,
        secondaryEmotions: secondaryTags || [],
        emotionScore: 3,
        theme: selectedTheme !== 'default' ? selectedTheme : undefined,
      });

      // 2. Upload photos + save positions (photo API)
      const canvasW = canvasSize.width || SCREEN_W - (CANVAS_PADDING_H * 2);
      const photoObjects = objects.filter(o => o.type === 'photo');
      for (const photo of photoObjects) {
        if (photo.photoUri) {
          try {
            const uploaded = await diaryPhotoApi.upload(diary.id, photo.photoUri);
            if (uploaded?.id) {
              await diaryPhotoApi.updatePosition(uploaded.id, diary.id, {
                positionX: canvasW > 0 ? photo.x / canvasW : 0,
                positionY: canvasW > 0 ? photo.y / canvasW : 0,
                displayWidth: Math.round(photo.width),
                displayHeight: Math.round(photo.height),
                zIndex: photo.zIndex,
                rotation: photo.rotation || 0,
              });
            }
          } catch (e: any) {
            console.warn('[DiaryCanvas] Photo save failed:', e?.message);
          }
        }
      }

      // 3. Save stickers only via decoration API
      const stickerObjects = objects.filter(o => o.type === 'sticker');
      if (stickerObjects.length > 0) {
        const decorations = stickerObjects.map((obj) => ({
          assetType: obj.stickerCode || '',
          positionX: canvasW > 0 ? obj.x / canvasW : 0,
          positionY: canvasW > 0 ? obj.y / canvasW : 0,
          scale: obj.width / 60,
          rotation: obj.rotation || 0,
          zIndex: obj.zIndex,
        }));
        try {
          await diaryDecorationApi.save(diary.id, decorations);
        } catch (e: any) {
          console.warn('[DiaryCanvas] Decoration save failed:', e?.message);
        }
      }

      console.log('[DiaryCanvas] Save complete:', {
        diaryId: diary.id,
        photosUploaded: photoObjects.length,
        stickersSaved: stickerObjects.length,
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
  }, [content, title, objects, currentEmotion, secondaryTags, selectedTheme, canvasSize, navigation]);

  const { refresh: refreshSubscription } = useSubscription();

  // ── Theme colors (v3 palette) ──
  const themeColors: Record<string, string> = {
    night: '#1A1A2E',
    warm: colors.bgWarm,
    nature: colors.bgCream,
    note: colors.bgIvory,
    grid: colors.bgCream,
  };
  const bgColor = themeColors[selectedTheme] || colors.bgWarm;
  const textColor = selectedTheme === 'night' ? '#EDEDF0' : colors.textPrimary;
  const subtleColor = selectedTheme === 'night' ? '#686880' : colors.textTertiary;
  const borderColor = selectedTheme === 'night' ? '#2A2A3A' : colors.accentSand + '40';

  const canHaveSomething = content.trim() || objects.length > 0;

  return (
    <PaperBackground variant="lined" color="warm" style={{ paddingTop: insets.top }}>
      {/* Header — transparent on paper */}
      <View style={[s.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Text style={[s.headerBtnText, { color: textColor }]}>취소</Text>
        </TouchableOpacity>
        <Text style={[s.headerDate, { color: selectedTheme === 'night' ? '#9898AC' : colors.textSecondary }]}>
          {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving || !canHaveSomething} style={s.headerBtn}>
          <Text style={[s.headerSaveText, {
            color: canHaveSomething ? colors.accentPrimary : colors.textTertiary,
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
          {/* Emotion Banner — paper memo card style */}
          <Animated.View style={{
            opacity: contentAnim,
            transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            paddingHorizontal: layout.screenPaddingH,
          }}>
            <TouchableOpacity
              onPress={() => setShowEmotionPicker(true)}
              style={[
                s.moodBanner,
                {
                  backgroundColor: currentEmotion
                    ? EMOTION_COLORS[currentEmotion] + '10'
                    : colors.bgIvory,
                  borderColor: currentEmotion
                    ? EMOTION_COLORS[currentEmotion] + '30'
                    : colors.accentSand,
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
                <Text style={[s.moodLabel, { color: colors.textSecondary }]}>
                  오늘 기분을 선택해주세요
                </Text>
              )}
              <Text style={[s.moodChangeHint, { color: colors.textTertiary }]}>
                {currentEmotion ? '변경' : '선택'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ═══ Canvas (shared renderer) ═══ */}
          <DiaryPageRenderer
            title={title}
            content={content}
            theme={selectedTheme}
            objects={objects}
            editable={true}
            onTitleChange={setTitle}
            onContentChange={setContent}
            onObjectMove={handleMove}
            onObjectResize={handleResize}
            onObjectRotate={handleRotate}
            onObjectDelete={handleDelete}
            onObjectBringForward={handleBringForward}
            onObjectSendBackward={handleSendBackward}
            onObjectSelect={setSelectedObjectId}
            selectedObjectId={selectedObjectId}
            onCanvasMeasure={(w, h) => setCanvasSize({ width: w, height: h })}
            textColor={textColor}
            subtleColor={subtleColor}
            borderColor={borderColor}
            bgColor={bgColor}
            autoFocus={!isEditMode}
            textInputRef={textInputRef}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Toolbar — glass scrapbook tool tray */}
      <View style={[s.toolbar, {
        paddingBottom: insets.bottom + 8,
      }]}>
        <TouchableOpacity style={s.toolBtn} onPress={handleAddPhoto}>
          <View style={s.toolIconView}>
            <View style={{ width: 18, height: 14, borderRadius: 3, borderWidth: 1.5, borderColor: colors.accentTerra, alignItems: 'center', justifyContent: 'flex-end' }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accentTerra, position: 'absolute', top: 1.5, right: 2.5 }} />
              <View style={{ width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderBottomWidth: 5, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: colors.accentTerra, marginBottom: 1 }} />
            </View>
          </View>
          <Text style={s.toolLabel}>사진</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.toolBtn} onPress={() => setShowThemeSheet(true)}>
          <View style={s.toolIconView}>
            <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: colors.accentPrimary }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accentMustard, position: 'absolute', top: 1.5, left: 4 }} />
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accentPrimary, position: 'absolute', bottom: 1.5, left: 1.5 }} />
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accentDustyBlue, position: 'absolute', bottom: 1.5, right: 1.5 }} />
            </View>
          </View>
          <Text style={s.toolLabel}>테마</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.toolBtn} onPress={() => setShowStickerSheet(true)}>
          <View style={s.toolIconView}>
            <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ position: 'absolute', width: 14, height: 2, backgroundColor: colors.accentPrimary, borderRadius: 1 }} />
              <View style={{ position: 'absolute', width: 2, height: 14, backgroundColor: colors.accentPrimary, borderRadius: 1 }} />
              <View style={{ position: 'absolute', width: 10, height: 2, backgroundColor: colors.accentPrimary, borderRadius: 1, transform: [{ rotate: '45deg' }] }} />
              <View style={{ position: 'absolute', width: 10, height: 2, backgroundColor: colors.accentPrimary, borderRadius: 1, transform: [{ rotate: '-45deg' }] }} />
            </View>
          </View>
          <Text style={s.toolLabel}>스티커</Text>
        </TouchableOpacity>

        {content.length > 0 && (
          <Text style={s.charCount}>
            {content.length}자
          </Text>
        )}
      </View>

      {/* AI Feedback Toast placeholder */}
      {/* TODO: Show after save or specific conditions
      <View style={s.aiToast}>
        <Text style={s.aiToastText}>오늘 하루도 수고했어요 ✿</Text>
      </View>
      */}

      {/* Sticker Picker Sheet */}
      <StickerPickerSheet
        visible={showStickerSheet}
        onClose={() => setShowStickerSheet(false)}
        onSelect={handleStickerSelect}
      />

      {/* Theme Sheet Modal */}
      <Modal visible={showThemeSheet} transparent animationType="slide">
        <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={() => setShowThemeSheet(false)}>
          <View style={[s.sheetContent, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={s.sheetTitle}>테마 선택</Text>
            {DIARY_THEMES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[s.sheetOption, {
                  borderColor: selectedTheme === t.key ? colors.accentPrimary : colors.accentSand + '60',
                  backgroundColor: selectedTheme === t.key ? colors.accentPrimaryLight + '30' : colors.surfaceCard,
                }]}
                onPress={() => { setSelectedTheme(t.key); setShowThemeSheet(false); }}
              >
                <View style={[s.sheetDot, { backgroundColor: t.color, borderWidth: 1, borderColor: colors.accentSand }]} />
                <Text style={[s.sheetOptionText, { color: colors.textPrimary }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Emotion Picker Modal */}
      <Modal visible={showEmotionPicker} transparent animationType="slide">
        <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={() => setShowEmotionPicker(false)}>
          <View style={[s.sheetContent, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={s.sheetTitle}>오늘의 기분</Text>
            <View style={s.emotionGrid}>
              {EMOTION_KEYS.map((key) => {
                const isSelected = currentEmotion === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      s.emotionGridItem,
                      {
                        borderColor: isSelected ? EMOTION_COLORS[key] : colors.accentSand + '60',
                        backgroundColor: isSelected ? EMOTION_COLORS[key] + '15' : colors.surfaceCard,
                      },
                    ]}
                    onPress={() => { setCurrentEmotion(key); setShowEmotionPicker(false); }}
                  >
                    <EmotionStickerView emotionKey={key} size="small" />
                    <Text style={[s.emotionGridLabel, { color: isSelected ? EMOTION_COLORS[key] : colors.textSecondary }]}>
                      {EMOTION_LABELS[key]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  // Header — transparent on paper
  header: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: layout.screenPaddingH,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { height: 44, justifyContent: 'center', paddingHorizontal: 4 },
  headerBtnText: {
    fontFamily: fontFamily.sans,
    fontSize: 15, fontWeight: '500',
  },
  headerDate: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 16, fontWeight: '400',
    color: colors.textSecondary,
  },
  headerSaveText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 15, fontWeight: '600',
  },

  // Mood Banner — paper memo card feel
  moodBanner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: borderRadius.sm, marginTop: spacing.xl,
    borderWidth: 1, gap: spacing.sm,
    ...shadows.crisp,
  },
  moodLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 15, fontWeight: '600',
  },
  moodTags: {
    fontFamily: fontFamily.sans,
    fontSize: 12, marginLeft: 4, flex: 1,
  },
  moodChangeHint: {
    fontFamily: fontFamily.sans,
    fontSize: 12, marginLeft: 'auto',
    color: colors.textTertiary,
  },

  // Bottom Toolbar — glass tool tray
  toolbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 10, paddingHorizontal: layout.screenPaddingH,
    borderTopWidth: 1, borderTopColor: colors.glassBorderSubtle,
    backgroundColor: colors.glassWhite,
    gap: spacing.xl,
  },
  toolBtn: { alignItems: 'center', gap: 2 },
  toolIconView: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  toolLabel: {
    fontFamily: fontFamily.sans,
    fontSize: 10, color: colors.textSecondary,
  },
  charCount: {
    ...typography.caption,
    marginLeft: 'auto',
    color: colors.textTertiary,
  },

  // AI Feedback Toast
  aiToast: {
    position: 'absolute', bottom: 100, left: spacing['2xl'], right: spacing['2xl'],
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    ...shadows.soft,
    alignItems: 'center',
  },
  aiToastText: {
    fontFamily: fontFamily.script,
    fontSize: 16, color: colors.textSecondary,
  },

  // Sheet — glass style
  sheetOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: colors.overlayDim,
  },
  sheetContent: {
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    padding: spacing['2xl'],
    backgroundColor: colors.glassWhite,
  },
  sheetTitle: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 22, fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.xl, textAlign: 'center',
  },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm, borderWidth: 1, marginBottom: spacing.sm,
    gap: spacing.md,
  },
  sheetDot: { width: 20, height: 20, borderRadius: 10 },
  sheetOptionText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 15, fontWeight: '500',
    color: colors.textPrimary,
  },

  // Emotion picker grid
  emotionGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: spacing.md,
  },
  emotionGridItem: {
    alignItems: 'center', justifyContent: 'center',
    width: 72, paddingVertical: spacing.md,
    borderRadius: borderRadius.lg, borderWidth: 1.5,
    gap: 6,
  },
  emotionGridLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 12, fontWeight: '600',
  },
});
