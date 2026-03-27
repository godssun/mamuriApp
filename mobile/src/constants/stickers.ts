import { EmotionKey } from '../types';

export const EMOTION_COLORS: Record<EmotionKey, string> = {
  JOY: '#FFD166',
  CALM: '#83C9A8',
  SAD: '#7BA7D9',
  ANXIOUS: '#E8A87C',
  COMPLEX: '#B8B0C8',
};

export const EMOTION_LABELS: Record<EmotionKey, string> = {
  JOY: '좋아요',
  CALM: '괜찮아요',
  SAD: '별로예요',
  ANXIOUS: '힘들어요',
  COMPLEX: '복잡해요',
};

export const EMOTION_ICONS: Record<EmotionKey, string> = {
  JOY: '☀️',
  CALM: '🌿',
  SAD: '💧',
  ANXIOUS: '🔥',
  COMPLEX: '🌀',
};

export const SECONDARY_TAGS: Record<EmotionKey, string[]> = {
  JOY: ['설렘', '감사', '뿌듯함', '신남', '사랑스러움', '행복함'],
  CALM: ['평온', '안정', '여유', '무덤덤', '차분함'],
  SAD: ['외로움', '그리움', '공허함', '서운함', '슬픔', '쓸쓸함'],
  ANXIOUS: ['불안', '걱정', '긴장', '피곤', '답답함', '지침', '부담스러움'],
  COMPLEX: ['혼란', '후회', '아쉬움', '복잡함', '모르겠음', '무기력'],
};

export const STICKER_SIZES = {
  hero: 80,
  medium: 48,
  small: 32,
  mini: 24,
  tiny: 20,
} as const;

export const EMOTION_KEYS: EmotionKey[] = ['JOY', 'CALM', 'SAD', 'ANXIOUS', 'COMPLEX'];

export const DIARY_THEMES = [
  { key: 'default', label: '기본', color: '#FAFAF8' },
  { key: 'warm', label: '따뜻한', color: '#FFF8F0' },
  { key: 'night', label: '밤하늘', color: '#1A1A2E' },
  { key: 'nature', label: '자연', color: '#F0F7F0' },
] as const;
