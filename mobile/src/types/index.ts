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
  aiTone: 'warm' | 'calm' | 'cheerful';
  aiEnabled: boolean;
}

// 구독
export type SubscriptionStatusType = 'FREE' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';

export interface SubscriptionInfo {
  status: SubscriptionStatusType;
  quotaUsed: number;
  quotaLimit: number; // -1이면 무제한 (프리미엄)
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
