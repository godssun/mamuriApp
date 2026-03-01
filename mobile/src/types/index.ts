// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
}

// 인증
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// AI 친구
export interface CompanionProfile {
  aiName: string;
  level: number;
  diaryCount: number;
  nextLevelDiaryCount: number;
  maxLevel: boolean;
}

export interface CompanionUpdateRequest {
  aiName: string;
}

export interface LevelUpInfo {
  oldLevel: number;
  newLevel: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  streakActive: boolean;
}

// 일기
export interface AiComment {
  id: number;
  content: string;
  createdAt: string;
}

export interface Diary {
  id: number;
  title: string;
  content: string;
  diaryDate: string; // YYYY-MM-DD
  aiComment: AiComment | null;
  levelUp?: LevelUpInfo | null;
  streakInfo?: StreakInfo | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryCreateRequest {
  title: string;
  content: string;
  diaryDate?: string; // YYYY-MM-DD (선택적, 기본값 오늘)
}

export interface DiaryUpdateRequest {
  title: string;
  content: string;
  diaryDate?: string; // YYYY-MM-DD (선택적)
}

export interface StreakResponse {
  currentStreak: number;
  longestStreak: number;
  lastDiaryDate: string | null;
}

export interface DiaryCalendarResponse {
  year: number;
  month: number;
  datesWithDiaries: string[]; // YYYY-MM-DD[]
}

// 설정
export interface UserSettings {
  aiTone: 'warm' | 'calm' | 'cheerful' | 'realistic';
  aiEnabled: boolean;
}

// 컴패니언 개인화 설정
export interface CompanionSettings {
  avatar: string | null;
  speechStyle: 'formal' | 'casual';
  aiTone: 'warm' | 'calm' | 'cheerful' | 'realistic';
  aiEnabled: boolean;
}

export interface CompanionSettingsUpdateRequest {
  speechStyle: 'formal' | 'casual';
  aiTone: 'warm' | 'calm' | 'cheerful' | 'realistic';
}

// 대화
export interface ConversationMessage {
  id: number;
  role: 'USER' | 'AI';
  content: string;
  createdAt: string;
}

export interface ConversationLimits {
  maxRepliesPerDay: number;
  usedRepliesToday: number;
  remainingReplies: number | null; // null이면 무제한
  tier: string;
  trialActive: boolean;
}

export interface ConversationHistoryResponse {
  diaryId: number;
  messages: ConversationMessage[];
  limits: ConversationLimits;
}

export interface ConversationReplyResponse {
  userMessageId: number;
  aiMessageId: number;
  aiResponse: string;
  remainingReplies: number | null; // null이면 무제한
  createdAt: string;
}

// 구독
export type SubscriptionTier = 'FREE' | 'DELUXE' | 'PREMIUM';

export type SubscriptionStatusType = 'FREE' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';

export interface SubscriptionInfo {
  status: SubscriptionStatusType;
  tier: string;
  trialActive: boolean;
  trialEnd: string | null;
  dailyRepliesMax: number; // -1 = unlimited, 0 = blocked
  currentPeriodEnd: string | null;
  crisisFlag: boolean;
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

// 네비게이션
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  CompanionSetup: undefined;
  Settings: undefined;
  Paywall: undefined;
  Subscription: undefined;
};

export type MainTabParamList = {
  DiaryList: undefined;
  Companion: undefined;
};

export type DiaryStackParamList = {
  DiaryListHome: undefined;
  WriteDiary: undefined;
  DiaryDetail: { diaryId: number };
};
