/**
 * StickerPickerSheet — Bottom sheet for selecting decorative stickers
 *
 * - Modal-based bottom sheet
 * - Tab bar: 감정 / 무드
 * - 4-column grid with PNG sticker images
 * - Selection callback
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Dimensions,
  Image, ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeV2 } from '../../design-system-v2';

const { width: SCREEN_W } = Dimensions.get('window');
const COL_COUNT = 4;
const ITEM_SIZE = (SCREEN_W - 48 - (COL_COUNT - 1) * 12) / COL_COUNT;

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
    label: '감정',
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

export function StickerPickerSheet({ visible, onClose, onSelect }: StickerPickerSheetProps) {
  const { theme } = useThemeV2();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('emotion');

  const currentTab = STICKER_TABS.find(t => t.key === activeTab) || STICKER_TABS[0];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.sheet, {
            backgroundColor: theme.colors.surface,
            paddingBottom: insets.bottom + 16,
          }]}
          onStartShouldSetResponder={() => true}
        >
          {/* Handle bar */}
          <View style={styles.handleBar}>
            <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            {STICKER_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tab,
                    {
                      backgroundColor: isActive ? theme.colors.primarySubtle : 'transparent',
                      borderRadius: theme.borderRadius.full,
                    },
                  ]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text style={[
                    styles.tabText,
                    {
                      color: isActive ? theme.colors.primary : theme.colors.textSecondary,
                      fontWeight: isActive ? '700' : '400',
                    },
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Grid */}
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {currentTab.stickers.map((sticker) => (
                <TouchableOpacity
                  key={sticker.code}
                  style={[styles.stickerItem, {
                    width: ITEM_SIZE,
                    height: ITEM_SIZE,
                    backgroundColor: theme.colors.surfaceSecondary,
                    borderRadius: theme.borderRadius.lg,
                  }]}
                  onPress={() => {
                    onSelect({ code: sticker.code, category: currentTab.key });
                  }}
                  activeOpacity={0.6}
                >
                  <Image source={sticker.source} style={styles.stickerImage} resizeMode="contain" />
                  <Text style={[styles.stickerLabel, { color: theme.colors.textTertiary }]}>
                    {sticker.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingHorizontal: 24,
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stickerItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  stickerImage: {
    width: ITEM_SIZE * 0.55,
    height: ITEM_SIZE * 0.55,
  },
  stickerLabel: {
    fontSize: 10,
    marginTop: 4,
  },
});
