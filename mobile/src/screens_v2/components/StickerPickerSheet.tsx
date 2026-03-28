/**
 * StickerPickerSheet — Scrapbook sticker drawer
 *
 * Glass-effect bottom sheet with category pill tabs.
 * "페이지를 꾸미기 위해 서랍을 여는 느낌"
 *
 * v3 design system: GlassBottomSheet, PillTabs, blob styles, paper tokens.
 * No react-native-svg dependency.
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Dimensions,
  Image, ImageSourcePropType, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  colors,
  fontFamily,
  typography,
  shadows,
  spacing,
  borderRadius,
  layout,
} from '../../design-system-v3';

const { width: SCREEN_W } = Dimensions.get('window');
const COL_COUNT = 4;
const GRID_PAD = spacing['2xl'] * 2;
const GRID_GAP = spacing.lg;
const ITEM_SIZE = (SCREEN_W - GRID_PAD - (COL_COUNT - 1) * GRID_GAP) / COL_COUNT;

interface StickerItem {
  code: string;
  source: ImageSourcePropType;
  label: string;
}

interface StickerPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (sticker: { code: string; category: string }) => void;
}

const STICKER_TABS: { key: string; label: string; stickers: StickerItem[] }[] = [
  {
    key: 'emotion',
    label: '감정 & 에셋',
    stickers: [
      { code: 'e_joy', source: require('../../../assets/stickers/emotion/joy.png'), label: '좋아요' },
      { code: 'e_calm', source: require('../../../assets/stickers/emotion/calm.png'), label: '괜찮아요' },
      { code: 'e_sad', source: require('../../../assets/stickers/emotion/sad.png'), label: '슬퍼요' },
      { code: 'e_anxious', source: require('../../../assets/stickers/emotion/anxious.png'), label: '불안해요' },
      { code: 'e_complex', source: require('../../../assets/stickers/emotion/complex.png'), label: '복잡해요' },
    ],
  },
  {
    key: 'mood',
    label: '무드',
    stickers: [
      { code: 'm_sunny', source: require('../../../assets/stickers/deco/mood/sunny.png'), label: '맑음' },
      { code: 'm_cloudy', source: require('../../../assets/stickers/deco/mood/cloudy.png'), label: '흐림' },
      { code: 'm_rainy', source: require('../../../assets/stickers/deco/mood/rainy.png'), label: '비' },
      { code: 'm_snowy', source: require('../../../assets/stickers/deco/mood/snowy.png'), label: '눈' },
      { code: 'm_rainbow', source: require('../../../assets/stickers/deco/mood/rainbow.png'), label: '무지개' },
      { code: 'm_night_sky', source: require('../../../assets/stickers/deco/mood/night_sky.png'), label: '밤하늘' },
      { code: 'm_flower', source: require('../../../assets/stickers/deco/mood/flower.png'), label: '꽃' },
      { code: 'm_leaf', source: require('../../../assets/stickers/deco/mood/leaf.png'), label: '잎사귀' },
      { code: 'm_tree', source: require('../../../assets/stickers/deco/mood/tree.png'), label: '나무' },
      { code: 'm_star', source: require('../../../assets/stickers/deco/mood/star.png'), label: '별' },
      { code: 'm_sparkle', source: require('../../../assets/stickers/deco/mood/sparkle.png'), label: '반짝' },
      { code: 'm_wind', source: require('../../../assets/stickers/deco/mood/wind.png'), label: '바람' },
    ],
  },
];

// Blob-like border radii for sticker cells — organic, hand-placed feel
const blobRadii = [
  { borderTopLeftRadius: 14, borderTopRightRadius: 18, borderBottomRightRadius: 16, borderBottomLeftRadius: 20 },
  { borderTopLeftRadius: 18, borderTopRightRadius: 14, borderBottomRightRadius: 20, borderBottomLeftRadius: 16 },
  { borderTopLeftRadius: 16, borderTopRightRadius: 20, borderBottomRightRadius: 14, borderBottomLeftRadius: 18 },
  { borderTopLeftRadius: 20, borderTopRightRadius: 16, borderBottomRightRadius: 18, borderBottomLeftRadius: 14 },
];

export function StickerPickerSheet({ visible, onClose, onSelect }: StickerPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const currentTab = STICKER_TABS[activeTabIndex];
  const tabLabels = STICKER_TABS.map(t => t.label);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
          onStartShouldSetResponder={() => true}
        >
          {/* Drag Handle */}
          <View style={styles.handleBar}>
            <View style={styles.handle} />
          </View>

          {/* Category Pill Tabs */}
          <View style={styles.tabContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabRow}
            >
              {tabLabels.map((label, index) => {
                const isActive = index === activeTabIndex;
                return (
                  <TouchableOpacity
                    key={label}
                    style={[styles.pill, isActive && styles.pillActive]}
                    onPress={() => setActiveTabIndex(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Sticker Grid */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.grid}>
              {currentTab.stickers.map((sticker, index) => (
                <TouchableOpacity
                  key={sticker.code}
                  style={[
                    styles.stickerCell,
                    blobRadii[index % blobRadii.length],
                    { width: ITEM_SIZE, height: ITEM_SIZE },
                  ]}
                  onPress={() => onSelect({ code: sticker.code, category: currentTab.key })}
                  activeOpacity={0.6}
                >
                  <Image
                    source={sticker.source}
                    style={styles.stickerImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.stickerLabel}>{sticker.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Close Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>서랍 닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Overlay — dim with warm tint
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlayDim,
  },

  // Sheet — glass effect
  sheet: {
    backgroundColor: colors.glassWhite,
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    borderLeftWidth: 1,
    borderLeftColor: colors.glassBorderSubtle,
    borderRightWidth: 1,
    borderRightColor: colors.glassBorderSubtle,
    maxHeight: '65%',
    ...shadows.float,
  },

  // Drag Handle
  handleBar: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  handle: {
    width: layout.dragHandleWidth,
    height: layout.dragHandleHeight,
    backgroundColor: 'rgba(138, 122, 113, 0.3)',
    borderRadius: borderRadius.xxs,
  },

  // Pill Tabs
  tabContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: layout.pillPaddingH,
    paddingVertical: layout.pillPaddingV,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: colors.pillActiveBg,
    borderColor: 'rgba(0, 0, 0, 0.02)',
    ...shadows.crisp,
  },
  pillText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 13,
    color: colors.pillInactiveText,
  },
  pillTextActive: {
    color: colors.pillActiveText,
  },

  // Grid
  scrollContent: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  stickerCell: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: spacing.xs,
  },
  stickerImage: {
    width: ITEM_SIZE * 0.5,
    height: ITEM_SIZE * 0.5,
  },
  stickerLabel: {
    fontFamily: fontFamily.sans,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 3,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  closeBtn: {
    backgroundColor: colors.buttonBgDark,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 200,
    alignItems: 'center',
    ...shadows.crisp,
  },
  closeBtnText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 14,
    color: colors.buttonTextLight,
  },
});
