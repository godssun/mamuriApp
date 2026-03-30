/**
 * CustomStickerScreen V3 — 나만의 스티커 만들기
 *
 * MVP 흐름:
 * 1. 사진 선택 (갤러리)
 * 2. 미리보기 (원본 표시)
 * 3. 스티커로 저장
 * 4. 내 스티커 목록
 *
 * Premium gate: 비구독자는 진입 시 Paywall 유도
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Alert,
  FlatList, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import {
  colors, fontFamily, shadows, spacing, borderRadius, layout,
} from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useCustomStickers } from '../contexts/CustomStickerContext';
import type { CustomSticker } from '../types';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_COLS = 3;
const ITEM_SIZE = (SCREEN_W - layout.screenPaddingH * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

export default function CustomStickerScreenV3() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const { t } = useTranslation();
  const { isPremium } = useSubscription();
  const { stickers, addSticker, removeSticker, isLoading } = useCustomStickers();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [borderStyle, setBorderStyle] = useState<'none' | 'white' | 'black' | 'shadow'>('none');

  // 비구독자 차단
  if (!isPremium) {
    return (
      <PaperBackground variant="plain" color="cream" style={{ paddingTop: insets.top }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>{t('premium.customSticker')}</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={s.gateContainer}>
          <View style={s.gateBadge}>
            <Text style={s.gateBadgeText}>PRO</Text>
          </View>
          <Text style={s.gateTitle}>{t('premium.featureLocked')}</Text>
          <Text style={s.gateDesc}>{t('premium.subscribeToUnlock')}</Text>
          <TouchableOpacity
            style={s.gateBtn}
            onPress={() => nav.navigate('Paywall')}
            activeOpacity={0.7}
          >
            <Text style={s.gateBtnText}>{t('premium.viewPlans')}</Text>
          </TouchableOpacity>
        </View>
      </PaperBackground>
    );
  }

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('common.permissionRequired'), t('common.photoPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSaveSticker = async () => {
    if (!selectedImage) return;
    setIsSaving(true);
    try {
      await addSticker({
        originalUri: selectedImage,
        stickerUri: selectedImage,
        thumbnailUri: selectedImage,
        width: 200,
        height: 200,
        borderStyle,
      });
      setSelectedImage(null);
      Alert.alert(t('common.alert'), t('customSticker.saved'));
    } catch {
      Alert.alert(t('common.error'), t('common.retry'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSticker = (sticker: CustomSticker) => {
    Alert.alert(
      t('sticker.deleteTitle'),
      t('sticker.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => removeSticker(sticker.id) },
      ],
    );
  };

  return (
    <PaperBackground variant="plain" color="cream" style={{ paddingTop: insets.top }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('premium.customSticker')}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* 사진 선택 / 미리보기 */}
      {selectedImage ? (
        <View style={s.previewSection}>
          <Image
            source={{ uri: selectedImage }}
            style={[
              s.previewImage,
              borderStyle === 'white' && s.previewBorderWhite,
              borderStyle === 'black' && s.previewBorderBlack,
              borderStyle === 'shadow' && s.previewBorderShadow,
            ]}
          />

          {/* Border Style Selector */}
          <Text style={s.borderLabel}>{t('customSticker.borderStyle')}</Text>
          <View style={s.borderRow}>
            {(['none', 'white', 'black', 'shadow'] as const).map((style) => {
              const isSelected = borderStyle === style;
              const labelKey = `customSticker.border${style.charAt(0).toUpperCase() + style.slice(1)}` as const;
              return (
                <TouchableOpacity
                  key={style}
                  style={[s.borderOption, isSelected && s.borderOptionActive]}
                  onPress={() => setBorderStyle(style)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    s.borderSwatch,
                    style === 'none' && { backgroundColor: colors.bgIvory, borderWidth: 1, borderColor: colors.accentSand + '60', borderStyle: 'dashed' },
                    style === 'white' && { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#FFFFFF' },
                    style === 'black' && { backgroundColor: '#000000' },
                    style === 'shadow' && { backgroundColor: colors.bgIvory, ...shadows.float },
                  ]} />
                  <Text style={[s.borderOptionText, isSelected && s.borderOptionTextActive]}>
                    {t(labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={s.previewActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setSelectedImage(null); setBorderStyle('none'); }}>
              <Text style={s.cancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.saveBtn, isSaving && { opacity: 0.5 }]}
              onPress={handleSaveSticker}
              disabled={isSaving}
            >
              <Text style={s.saveBtnText}>
                {isSaving ? t('customSticker.saving') : t('customSticker.saveSticker')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={s.pickArea} onPress={handlePickImage} activeOpacity={0.7}>
          <Text style={s.pickPlus}>+</Text>
          <Text style={s.pickText}>{t('customSticker.pickPhoto')}</Text>
        </TouchableOpacity>
      )}

      {/* 내 스티커 목록 */}
      <View style={s.listSection}>
        <Text style={s.listTitle}>
          {t('customSticker.myStickers')} ({stickers.length})
        </Text>
        {stickers.length === 0 ? (
          <Text style={s.emptyText}>{t('customSticker.empty')}</Text>
        ) : (
          <FlatList
            data={stickers}
            keyExtractor={(item) => item.id}
            numColumns={GRID_COLS}
            columnWrapperStyle={{ gap: GRID_GAP }}
            contentContainerStyle={{ gap: GRID_GAP }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.stickerItem}
                onLongPress={() => handleDeleteSticker(item)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: item.stickerUri }} style={s.stickerImage} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </PaperBackground>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH, paddingVertical: spacing.md,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  backText: { fontFamily: fontFamily.sansLight, fontSize: 22, color: colors.textPrimary },
  headerTitle: {
    fontFamily: fontFamily.serifItalic, fontSize: 18, color: colors.textPrimary,
  },

  // Gate (비구독자)
  gateContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  gateBadge: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.accentPrimary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.lg,
  },
  gateBadgeText: {
    fontFamily: fontFamily.sansSemiBold, fontSize: 14,
    color: '#FFFFFF', letterSpacing: 1,
  },
  gateTitle: {
    fontFamily: fontFamily.serifItalic, fontSize: 20,
    color: colors.textPrimary, marginBottom: spacing.sm,
  },
  gateDesc: {
    fontFamily: fontFamily.sans, fontSize: 13,
    color: colors.textSecondary, textAlign: 'center',
    lineHeight: 20, marginBottom: spacing.xl,
  },
  gateBtn: {
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
  },
  gateBtnText: {
    fontFamily: fontFamily.sansMedium, fontSize: 14, color: '#FFFFFF',
  },

  // 사진 선택 영역
  pickArea: {
    marginHorizontal: layout.screenPaddingH,
    height: 200,
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.sm,
    borderWidth: 2, borderStyle: 'dashed',
    borderColor: colors.accentSand + '60',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.xl,
  },
  pickPlus: {
    fontFamily: fontFamily.sansLight, fontSize: 40,
    color: colors.textTertiary, marginBottom: spacing.xs,
  },
  pickText: {
    fontFamily: fontFamily.sans, fontSize: 14, color: colors.textSecondary,
  },

  // 미리보기
  previewSection: {
    alignItems: 'center', marginHorizontal: layout.screenPaddingH,
    marginBottom: spacing.xl,
  },
  previewImage: {
    width: 200, height: 200, borderRadius: borderRadius.sm,
    backgroundColor: colors.bgIvory, marginBottom: spacing.md,
  },
  previewBorderWhite: {
    borderWidth: 4, borderColor: '#FFFFFF',
  },
  previewBorderBlack: {
    borderWidth: 4, borderColor: '#000000',
  },
  previewBorderShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  borderLabel: {
    fontFamily: fontFamily.sansMedium, fontSize: 13,
    color: colors.textSecondary, marginBottom: spacing.sm,
  },
  borderRow: {
    flexDirection: 'row', gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  borderOption: {
    alignItems: 'center', gap: 4,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm, borderWidth: 1.5,
    borderColor: 'transparent',
  },
  borderOptionActive: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimary + '10',
  },
  borderSwatch: {
    width: 28, height: 28, borderRadius: 14,
  },
  borderOptionText: {
    fontFamily: fontFamily.sans, fontSize: 11,
    color: colors.textTertiary,
  },
  borderOptionTextActive: {
    color: colors.accentPrimary,
    fontFamily: fontFamily.sansMedium,
  },
  previewActions: {
    flexDirection: 'row', gap: spacing.md,
  },
  cancelBtn: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: borderRadius.sm, borderWidth: 1,
    borderColor: colors.accentSand + '60',
  },
  cancelBtnText: {
    fontFamily: fontFamily.sans, fontSize: 14, color: colors.textSecondary,
  },
  saveBtn: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: borderRadius.sm, backgroundColor: colors.accentPrimary,
  },
  saveBtnText: {
    fontFamily: fontFamily.sansMedium, fontSize: 14, color: '#FFFFFF',
  },

  // 스티커 목록
  listSection: {
    flex: 1, paddingHorizontal: layout.screenPaddingH,
  },
  listTitle: {
    fontFamily: fontFamily.serifItalic, fontSize: 16,
    color: colors.textPrimary, marginBottom: spacing.md,
  },
  emptyText: {
    fontFamily: fontFamily.sans, fontSize: 13,
    color: colors.textTertiary, textAlign: 'center',
    marginTop: spacing.xl,
  },
  stickerItem: {
    width: ITEM_SIZE, height: ITEM_SIZE,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgIvory,
    overflow: 'hidden',
    ...shadows.crisp,
  },
  stickerImage: {
    width: '100%', height: '100%',
  },
});
