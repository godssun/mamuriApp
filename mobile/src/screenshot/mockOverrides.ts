/**
 * Screenshot Mode - API Mock Overrides
 *
 * Monkey-patches all API modules to return static mock data
 * so screens render with realistic content without a backend.
 */

import {
  diaryApi,
  companionApi,
  conversationApi,
  settingsApi,
  subscriptionApi,
  authApi,
  tokenStorage,
  consentStorage,
} from '../api/client';
import type {
  Diary,
  CompanionProfile,
  CompanionSettings,
  StreakResponse,
  ConversationHistoryResponse,
  UserSettings,
  SubscriptionInfo,
  DiaryCalendarResponse,
  AiComment,
  TokenResponse,
} from '../types';

// ─── Mock Data ───────────────────────────────────────────

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d;
};

const MOCK_DIARIES: Diary[] = [
  {
    id: 1,
    title: '봄이 오는 소리',
    content:
      '오늘 출근길에 처음으로 매화가 핀 걸 봤다. 겨울이 길었던 만큼 작은 꽃 한 송이가 주는 위로가 컸다.\n\n회사에서는 여전히 바쁜 하루였지만, 점심시간에 잠깐 밖에 나가서 봄 햇살을 느꼈다. 따뜻한 공기가 얼굴에 닿는 순간, 뭔가 새롭게 시작할 수 있을 것 같은 기분이 들었다.',
    diaryDate: formatDate(daysAgo(0)),
    aiComment: {
      id: 101,
      content:
        '봄의 첫 매화를 발견하셨군요. 긴 겨울을 견딘 후 만나는 작은 꽃 한 송이의 의미가 남달랐을 것 같아요.\n\n바쁜 일상 속에서도 점심시간에 밖으로 나가 햇살을 느끼셨다니, 스스로를 돌보는 좋은 습관이에요. 그 따뜻한 순간이 하루를 버티는 힘이 되었을 거예요.',
      createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 22, 24).toISOString(),
    },
    createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 22, 23).toISOString(),
    updatedAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 22, 23).toISOString(),
  },
  {
    id: 2,
    title: '주말의 여유',
    content:
      '오랜만에 아무 계획 없이 하루를 보냈다. 카페에서 책을 읽고, 산책하고, 좋아하는 음악을 들었다.',
    diaryDate: formatDate(daysAgo(1)),
    aiComment: {
      id: 102,
      content: '계획 없이 보내는 하루도 때로는 가장 큰 선물이 되죠. 충분히 쉬셨길 바라요.',
      createdAt: daysAgo(1).toISOString(),
    },
    createdAt: daysAgo(1).toISOString(),
    updatedAt: daysAgo(1).toISOString(),
  },
  {
    id: 3,
    title: '회사에서 있었던 일',
    content:
      '프로젝트 마감이 다가오는데 팀원과 의견 충돌이 있었다. 내 생각을 잘 전달하지 못한 것 같아서...',
    diaryDate: formatDate(daysAgo(2)),
    aiComment: null,
    createdAt: daysAgo(2).toISOString(),
    updatedAt: daysAgo(2).toISOString(),
  },
  {
    id: 4,
    title: '감사한 하루',
    content:
      '오랜 친구가 갑자기 연락해왔다. 별 거 아닌 대화였지만 마음이 따뜻해졌다.',
    diaryDate: formatDate(daysAgo(3)),
    aiComment: {
      id: 104,
      content: '오랜 친구의 연락은 참 반갑죠. 서로를 떠올려주는 마음 자체가 소중한 거예요.',
      createdAt: daysAgo(3).toISOString(),
    },
    createdAt: daysAgo(3).toISOString(),
    updatedAt: daysAgo(3).toISOString(),
  },
];

const MOCK_PROFILE: CompanionProfile = {
  aiName: '마음이',
  level: 3,
  diaryCount: 28,
  nextLevelDiaryCount: 30,
  maxLevel: false,
};

const MOCK_STREAK: StreakResponse = {
  currentStreak: 7,
  longestStreak: 14,
  lastDiaryDate: formatDate(today),
};

const MOCK_COMPANION_SETTINGS: CompanionSettings = {
  avatar: null,
  speechStyle: 'formal',
  aiTone: 'warm',
  aiEnabled: true,
};

const MOCK_CONVERSATION: ConversationHistoryResponse = {
  diaryId: 1,
  messages: [
    {
      id: 201,
      role: 'AI',
      content: '안녕하세요! 오늘 하루는 어떠셨어요? 편하게 이야기해 주세요 :)',
      createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 21, 0).toISOString(),
    },
    {
      id: 202,
      role: 'USER',
      content: '오늘 좀 힘든 하루였어. 회사에서 실수를 해서 마음이 무거워.',
      createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 21, 0, 30).toISOString(),
    },
    {
      id: 203,
      role: 'AI',
      content:
        '회사에서 실수가 있으셨군요. 그런 날은 마음이 정말 무겁죠. 실수했다는 것 자체가 열심히 하고 있다는 증거이기도 해요.\n\n혹시 어떤 일이 있었는지 이야기해주실 수 있을까요? 마음에 담아두기만 하면 더 힘들어질 수 있으니까요.',
      createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 21, 1).toISOString(),
    },
  ],
  limits: {
    maxRepliesPerDay: 10,
    usedRepliesToday: 2,
    remainingReplies: 8,
    tier: 'FREE',
    trialActive: true,
  },
};

const MOCK_USER_SETTINGS: UserSettings = {
  aiTone: 'warm',
  aiEnabled: true,
  backgroundTheme: 'warm',
  fontFamily: 'system',
  fontSize: 'medium',
  language: 'ko',
  aiDataConsent: true,
};

const MOCK_SUBSCRIPTION: SubscriptionInfo = {
  status: 'FREE',
  tier: 'FREE',
  trialActive: true,
  trialEnd: null,
  dailyRepliesMax: 3,
  currentPeriodEnd: null,
  crisisFlag: false,
};

// ─── Apply Overrides ─────────────────────────────────────

export function applyMockOverrides() {
  // Token storage - no-op on web
  tokenStorage.get = async () => ({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  });
  tokenStorage.save = async () => {};
  tokenStorage.clear = async () => {};

  consentStorage.get = async () => true;
  consentStorage.save = async () => {};
  consentStorage.clear = async () => {};

  // Auth API
  authApi.refresh = async () => ({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  });
  authApi.logout = async () => {};

  // Diary API
  diaryApi.getList = async () => MOCK_DIARIES;
  diaryApi.getListByMonth = async () => MOCK_DIARIES;
  diaryApi.getListByDate = async (_date: string) => MOCK_DIARIES;
  diaryApi.getCalendar = async (year: number, month: number) => ({
    year,
    month,
    datesWithDiaries: MOCK_DIARIES.map((d) => d.diaryDate),
  });
  diaryApi.getDetail = async (id: number) =>
    MOCK_DIARIES.find((d) => d.id === id) ?? MOCK_DIARIES[0];
  diaryApi.create = async () => MOCK_DIARIES[0];
  diaryApi.update = async () => MOCK_DIARIES[0];
  diaryApi.delete = async () => {};
  diaryApi.retryAiComment = async () => MOCK_DIARIES[0].aiComment!;

  // Companion API
  companionApi.getProfile = async () => MOCK_PROFILE;
  companionApi.updateName = async () => MOCK_PROFILE;
  companionApi.getStreak = async () => MOCK_STREAK;
  companionApi.getSettings = async () => MOCK_COMPANION_SETTINGS;
  companionApi.updateSettings = async () => MOCK_COMPANION_SETTINGS;
  companionApi.uploadAvatar = async () => MOCK_COMPANION_SETTINGS;
  companionApi.removeAvatar = async () => MOCK_COMPANION_SETTINGS;

  // Conversation API
  conversationApi.getConversation = async () => MOCK_CONVERSATION;
  conversationApi.sendReply = async () => ({
    userMessageId: 300,
    aiMessageId: 301,
    aiResponse: '그 마음 충분히 이해해요.',
    remainingReplies: 7,
    createdAt: new Date().toISOString(),
  });

  // Settings API
  settingsApi.get = async () => MOCK_USER_SETTINGS;
  settingsApi.update = async () => MOCK_USER_SETTINGS;

  // Subscription API
  subscriptionApi.getStatus = async () => MOCK_SUBSCRIPTION;

  console.log('[Screenshot Mode] Mock overrides applied');
}
