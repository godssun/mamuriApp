interface CompanionConfig {
  emoji: string;
  title: string;
  description: string;
}

const COMPANION_LEVELS: Record<number, CompanionConfig> = {
  1: { emoji: '🌰', title: '씨앗', description: '이제 막 심은 작은 씨앗이에요' },
  2: { emoji: '🌱', title: '새싹', description: '조금씩 싹이 트고 있어요' },
  3: { emoji: '🌿', title: '풀잎', description: '작은 잎이 돋아났어요' },
  4: { emoji: '☘️', title: '클로버', description: '건강하게 자라고 있어요' },
  5: { emoji: '🪴', title: '화분', description: '제법 듬직해졌어요' },
  6: { emoji: '🌳', title: '나무', description: '든든한 나무가 되었어요' },
  7: { emoji: '🌲', title: '큰 나무', description: '깊은 뿌리를 내렸어요' },
  8: { emoji: '🎄', title: '멋진 나무', description: '풍성하게 자랐어요' },
  9: { emoji: '🌴', title: '특별한 나무', description: '특별한 존재가 되었어요' },
  10: { emoji: '🏞️', title: '숲', description: '아름다운 숲이 되었어요!' },
};

export function getCompanionConfig(level: number): CompanionConfig {
  return COMPANION_LEVELS[level] ?? COMPANION_LEVELS[1];
}

export function calculateProgress(
  diaryCount: number,
  nextLevelDiaryCount: number,
  isMaxLevel: boolean,
  level: number,
): number {
  if (isMaxLevel) return 1;
  if (nextLevelDiaryCount <= 0) return 0;

  // 이전 레벨까지 필요했던 일기 수를 역산 (level 1 → 0, level 2 → 이전 threshold)
  // 서버에서 diaryCount와 nextLevelDiaryCount를 줌
  // progress = diaryCount / nextLevelDiaryCount (현재 레벨 내 진행도)
  const progress = diaryCount / nextLevelDiaryCount;
  return Math.min(Math.max(progress, 0), 1);
}
