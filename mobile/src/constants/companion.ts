import i18n from '../i18n/i18n';

interface CompanionConfig {
  emoji: string;
  titleKey: string;
}

const COMPANION_LEVELS: Record<number, CompanionConfig> = {
  1: { emoji: '🌰', titleKey: 'companionLevel.1' },
  2: { emoji: '🌱', titleKey: 'companionLevel.2' },
  3: { emoji: '🌿', titleKey: 'companionLevel.3' },
  4: { emoji: '☘️', titleKey: 'companionLevel.4' },
  5: { emoji: '🪴', titleKey: 'companionLevel.5' },
  6: { emoji: '🌳', titleKey: 'companionLevel.6' },
  7: { emoji: '🌲', titleKey: 'companionLevel.7' },
  8: { emoji: '🎄', titleKey: 'companionLevel.8' },
  9: { emoji: '🌴', titleKey: 'companionLevel.9' },
  10: { emoji: '🏞️', titleKey: 'companionLevel.10' },
};

/** Returns companion config with localized title */
export function getCompanionConfig(level: number): { emoji: string; title: string; description: string } {
  const config = COMPANION_LEVELS[level] ?? COMPANION_LEVELS[1];
  return {
    emoji: config.emoji,
    title: i18n.t(config.titleKey),
    description: '', // description no longer used in v3
  };
}

export function calculateProgress(
  diaryCount: number,
  nextLevelDiaryCount: number,
  isMaxLevel: boolean,
  level: number,
): number {
  if (isMaxLevel) return 1;
  if (nextLevelDiaryCount <= 0) return 0;
  const progress = diaryCount / nextLevelDiaryCount;
  return Math.min(Math.max(progress, 0), 1);
}
