/**
 * StickerPickerSheet — Bottom sheet for selecting decorative stickers
 *
 * - Modal-based bottom sheet
 * - Tab bar: 감정 / 무드 / 일상
 * - 4-column grid
 * - Selection callback
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeV2 } from '../../design-system-v2';

const { width: SCREEN_W } = Dimensions.get('window');
const COL_COUNT = 4;
const ITEM_SIZE = (SCREEN_W - 48 - (COL_COUNT - 1) * 12) / COL_COUNT;

interface StickerPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (sticker: { code: string; emoji: string; category: string }) => void;
}

const STICKER_TABS = [
  {
    key: 'emotion',
    label: '감정',
    stickers: [
      { code: 'e_joy', emoji: '☀️' },
      { code: 'e_calm', emoji: '🌿' },
      { code: 'e_sad', emoji: '💧' },
      { code: 'e_anxious', emoji: '🔥' },
      { code: 'e_complex', emoji: '🌀' },
      { code: 'e_love', emoji: '💕' },
      { code: 'e_star', emoji: '⭐' },
      { code: 'e_cloud', emoji: '☁️' },
    ],
  },
  {
    key: 'mood',
    label: '무드',
    stickers: [
      { code: 'm_rainbow', emoji: '🌈' },
      { code: 'm_moon', emoji: '🌙' },
      { code: 'm_sparkle', emoji: '✨' },
      { code: 'm_flower', emoji: '🌸' },
      { code: 'm_leaf', emoji: '🍃' },
      { code: 'm_wave', emoji: '🌊' },
      { code: 'm_snow', emoji: '❄️' },
      { code: 'm_sun', emoji: '🌅' },
    ],
  },
  {
    key: 'daily',
    label: '일상',
    stickers: [
      { code: 'd_coffee', emoji: '☕' },
      { code: 'd_book', emoji: '📖' },
      { code: 'd_music', emoji: '🎵' },
      { code: 'd_food', emoji: '🍽️' },
      { code: 'd_walk', emoji: '🚶' },
      { code: 'd_sleep', emoji: '😴' },
      { code: 'd_work', emoji: '💼' },
      { code: 'd_pet', emoji: '🐾' },
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
                    onSelect({ ...sticker, category: currentTab.key });
                    onClose();
                  }}
                  activeOpacity={0.6}
                >
                  <Text style={styles.stickerEmoji}>{sticker.emoji}</Text>
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
  },
  stickerEmoji: {
    fontSize: 28,
  },
});
