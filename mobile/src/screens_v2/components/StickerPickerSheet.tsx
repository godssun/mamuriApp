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
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  colors,
  fontFamily,
  typography,
  shadows,
  spacing,
  borderRadius,
  layout,
} from '../../design-system-v3';
import { useCustomStickers } from '../../contexts/CustomStickerContext';

const { width: SCREEN_W } = Dimensions.get('window');
const COL_COUNT = 4;
const GRID_PAD = spacing['2xl'] * 2;
const GRID_GAP = spacing.lg;
const ITEM_SIZE = (SCREEN_W - GRID_PAD - (COL_COUNT - 1) * GRID_GAP) / COL_COUNT;

interface StickerItem {
  code: string;
  source: ImageSourcePropType;
  labelKey: string;
}

interface StickerPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (sticker: { code: string; category: string; customUri?: string }) => void;
}

const STICKER_TABS: { key: string; labelKey: string; stickers: StickerItem[] }[] = [
  {
    key: 'emotion',
    labelKey: 'sticker.tabEmotion',
    stickers: [
      { code: 'e_joy', source: require('../../../assets/stickers/emotion/joy.png'), labelKey: 'sticker.e_joy' },
      { code: 'e_calm', source: require('../../../assets/stickers/emotion/calm.png'), labelKey: 'sticker.e_calm' },
      { code: 'e_sad', source: require('../../../assets/stickers/emotion/sad.png'), labelKey: 'sticker.e_sad' },
      { code: 'e_anxious', source: require('../../../assets/stickers/emotion/anxious.png'), labelKey: 'sticker.e_anxious' },
      { code: 'e_complex', source: require('../../../assets/stickers/emotion/complex.png'), labelKey: 'sticker.e_complex' },
    ],
  },
  {
    key: 'mood',
    labelKey: 'sticker.tabMood',
    stickers: [
      { code: 'm_sunny', source: require('../../../assets/stickers/deco/mood/sunny.png'), labelKey: 'sticker.m_sunny' },
      { code: 'm_cloudy', source: require('../../../assets/stickers/deco/mood/cloudy.png'), labelKey: 'sticker.m_cloudy' },
      { code: 'm_rainy', source: require('../../../assets/stickers/deco/mood/rainy.png'), labelKey: 'sticker.m_rainy' },
      { code: 'm_snowy', source: require('../../../assets/stickers/deco/mood/snowy.png'), labelKey: 'sticker.m_snowy' },
      { code: 'm_rainbow', source: require('../../../assets/stickers/deco/mood/rainbow.png'), labelKey: 'sticker.m_rainbow' },
      { code: 'm_night_sky', source: require('../../../assets/stickers/deco/mood/night_sky.png'), labelKey: 'sticker.m_night_sky' },
      { code: 'm_flower', source: require('../../../assets/stickers/deco/mood/flower.png'), labelKey: 'sticker.m_flower' },
      { code: 'm_leaf', source: require('../../../assets/stickers/deco/mood/leaf.png'), labelKey: 'sticker.m_leaf' },
      { code: 'm_tree', source: require('../../../assets/stickers/deco/mood/tree.png'), labelKey: 'sticker.m_tree' },
      { code: 'm_star', source: require('../../../assets/stickers/deco/mood/star.png'), labelKey: 'sticker.m_star' },
      { code: 'm_sparkle', source: require('../../../assets/stickers/deco/mood/sparkle.png'), labelKey: 'sticker.m_sparkle' },
      { code: 'm_wind', source: require('../../../assets/stickers/deco/mood/wind.png'), labelKey: 'sticker.m_wind' },
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
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { stickers: customStickers } = useCustomStickers();
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const allTabs = [
    ...STICKER_TABS,
    { key: 'my', labelKey: 'sticker.tabMy', stickers: [] as StickerItem[] },
  ];
  const currentTab = allTabs[activeTabIndex];
  const tabLabels = allTabs.map(tab => t(tab.labelKey));

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
            {currentTab.key === 'my' ? (
              customStickers.length === 0 ? (
                <View style={styles.emptyMyStickers}>
                  <Text style={styles.emptyMyText}>{t('customSticker.empty')}</Text>
                  <TouchableOpacity
                    style={styles.createStickerBtn}
                    onPress={() => { onClose(); navigation.navigate('CustomSticker'); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.createStickerBtnText}>{t('customSticker.createNew')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.grid}>
                  {customStickers.map((sticker, index) => (
                    <TouchableOpacity
                      key={sticker.id}
                      style={[
                        styles.stickerCell,
                        blobRadii[index % blobRadii.length],
                        { width: ITEM_SIZE, height: ITEM_SIZE },
                      ]}
                      onPress={() => onSelect({ code: sticker.id, category: 'custom', customUri: sticker.stickerUri })}
                      activeOpacity={0.6}
                    >
                      <Image
                        source={{ uri: sticker.stickerUri }}
                        style={styles.stickerImage}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )
            ) : (
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
                    <Text style={styles.stickerLabel}>{t(sticker.labelKey)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Close Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>{t('sticker.close')}</Text>
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

  // My Stickers empty state
  emptyMyStickers: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyMyText: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    color: colors.textTertiary,
    marginBottom: spacing.lg,
  },
  createStickerBtn: {
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    ...shadows.crisp,
  },
  createStickerBtnText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 14,
    color: '#FFFFFF',
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
