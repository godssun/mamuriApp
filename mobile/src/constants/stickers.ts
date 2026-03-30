import { ImageSourcePropType } from 'react-native';
import { EmotionKey } from '../types';
import i18n from '../i18n/i18n';

export const EMOTION_COLORS: Record<EmotionKey, string> = {
  JOY: '#FFD166',
  CALM: '#83C9A8',
  SAD: '#7BA7D9',
  ANXIOUS: '#E8A87C',
  COMPLEX: '#B8B0C8',
};

/** i18n-aware emotion label map — 접근 시점의 현재 언어로 반환 */
const EMOTION_LABEL_KEYS: Record<EmotionKey, string> = {
  JOY: 'emotion.joy',
  CALM: 'emotion.calm',
  SAD: 'emotion.sad',
  ANXIOUS: 'emotion.anxious',
  COMPLEX: 'emotion.complex',
};

/** Proxy를 사용해 EMOTION_LABELS[key] 패턴을 유지하면서 i18n 적용 */
export const EMOTION_LABELS: Record<string, string> = new Proxy({} as Record<string, string>, {
  get(_target, prop: string) {
    const key = EMOTION_LABEL_KEYS[prop as EmotionKey];
    return key ? i18n.t(key) : prop;
  },
});

export const EMOTION_ICONS: Record<EmotionKey, string> = {
  JOY: '☀️',
  CALM: '🌿',
  SAD: '💧',
  ANXIOUS: '🔥',
  COMPLEX: '🌀',
};

export const EMOTION_STICKER_IMAGES: Record<EmotionKey, ImageSourcePropType> = {
  JOY: require('../../assets/stickers/emotion/joy.png'),
  CALM: require('../../assets/stickers/emotion/calm.png'),
  SAD: require('../../assets/stickers/emotion/sad.png'),
  ANXIOUS: require('../../assets/stickers/emotion/anxious.png'),
  COMPLEX: require('../../assets/stickers/emotion/complex.png'),
};

const SECONDARY_TAG_KEYS: Record<EmotionKey, string[]> = {
  JOY: ['tags.thrill', 'tags.gratitude', 'tags.pride', 'tags.excited', 'tags.lovely', 'tags.happy'],
  CALM: ['tags.peaceful', 'tags.stable', 'tags.relaxed', 'tags.indifferent', 'tags.composed'],
  SAD: ['tags.lonely', 'tags.missing', 'tags.empty', 'tags.hurt', 'tags.tearful', 'tags.gloomy'],
  ANXIOUS: ['tags.anxious', 'tags.worried', 'tags.tense', 'tags.tired', 'tags.frustrated', 'tags.worn', 'tags.pressured'],
  COMPLEX: ['tags.confused', 'tags.regretful', 'tags.wistful', 'tags.complicated', 'tags.unsure', 'tags.listless'],
};

/** i18n-aware secondary tags — Proxy로 접근 시점의 현재 언어 반환 */
export const SECONDARY_TAGS: Record<string, string[]> = new Proxy({} as Record<string, string[]>, {
  get(_target, prop: string) {
    const keys = SECONDARY_TAG_KEYS[prop as EmotionKey];
    return keys ? keys.map(k => i18n.t(k)) : [];
  },
});

export const STICKER_SIZES = {
  hero: 80,
  large: 64,
  medium: 48,
  small: 32,
  mini: 24,
  tiny: 20,
} as const;

export const EMOTION_KEYS: EmotionKey[] = ['JOY', 'CALM', 'SAD', 'ANXIOUS', 'COMPLEX'];

/**
 * Diary Themes — 종이 타입 × 색상 조합
 *
 * 구조: paper pattern (plain/lined/grid) + color mood
 * 이전 키(warm, nature)는 DB 호환을 위해 LEGACY_THEME_MAP으로 매핑
 */
export const DIARY_THEMES = [
  // ── 기본 테마 (무료) ──
  { key: 'warm',    labelKey: 'theme.warmLined', color: '#F2EBE3', pattern: 'lined' as const, isDark: false, premium: false },
  { key: 'note',    labelKey: 'theme.lined',     color: '#FDFCF8', pattern: 'lined' as const, isDark: false, premium: false },
  { key: 'default', labelKey: 'theme.plain',     color: '#F4EFEA', pattern: 'none' as const,  isDark: false, premium: false },
  { key: 'grid',    labelKey: 'theme.grid',      color: '#F4EFEA', pattern: 'grid' as const,  isDark: false, premium: false },
  { key: 'night',   labelKey: 'theme.night',     color: '#1A1A2E', pattern: 'none' as const,  isDark: true,  premium: false },
  // ── 프리미엄 테마 (구겨진 종이 질감) ──
  { key: 'crumpled1',  labelKey: 'theme.crumpled1',  color: '#F2EEE8', pattern: 'none' as const,  isDark: false, premium: true },
  { key: 'crumpled2',  labelKey: 'theme.crumpled2',  color: '#F0ECE6', pattern: 'none' as const,  isDark: false, premium: true },
  { key: 'crumpled3',  labelKey: 'theme.crumpled3',  color: '#EDEAE4', pattern: 'none' as const,  isDark: false, premium: true },
] as const;

/** DB에 저장된 레거시 테마 키 → 현재 키 매핑 */
export const LEGACY_THEME_MAP: Record<string, string> = {
  nature: 'grid',
};

export type DiaryThemeKey = typeof DIARY_THEMES[number]['key'];
export type DiaryPattern = 'none' | 'lined' | 'grid';
