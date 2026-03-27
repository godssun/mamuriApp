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
  backgroundTheme: 'warm' | 'light' | 'dark';
  fontFamily: 'system' | 'serif';
  fontSize: 'small' | 'medium' | 'large';
  language?: 'ko' | 'en' | 'ja' | 'zh';
  aiDataConsent?: boolean;
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

// AI 응답 신고
export type ReportReason = 'inappropriate' | 'inaccurate' | 'offensive' | 'other';

export interface ReportRequest {
  messageId: number;
  diaryId: number;
  reason: ReportReason;
}

// 소셜 로그인
export type SocialProvider = 'GOOGLE' | 'APPLE';

export interface SocialLoginRequest {
  provider: SocialProvider;
  token: string;
  nickname?: string;
}

export interface SocialLoginResponse {
  accessToken: string | null;
  refreshToken: string | null;
  isNewUser: boolean;
  nickname: string | null;
}

// 계정 삭제
export interface DeleteAccountRequest {
  password?: string;
  reason: string;
  reasonDetail?: string;
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

// 네비게이션
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  SocialNickname: { provider: SocialProvider; token: string };
};

export type MainStackParamList = {
  MainTabs: undefined;
  CompanionSetup: undefined;
  Settings: undefined;
  DiaryArchive: undefined;
  DiaryDetailFromArchive: { diaryId: number };
  ReportDetail: { reportId: number };
  EmotionCalendar: undefined;
  EmotionPicker: { preselectedEmotion?: EmotionKey; returnTo?: string };
};

export type MainTabParamList = {
  Home: undefined;
  DiaryList: undefined;
  Companion: undefined;
  Reflect: undefined;
};

export type DiaryStackParamList = {
  DiaryListHome: undefined;
  WriteDiary: { editDiaryId: number } | undefined;
  DiaryDetail: { diaryId: number };
  AIComment: { diaryId: number };
};

// ── V3: 감정 스티커 시스템 ──

export type EmotionKey = 'JOY' | 'CALM' | 'SAD' | 'ANXIOUS' | 'COMPLEX';

export interface EmotionCategory {
  id: number;
  code: EmotionKey;
  nameKo: string;
  displayOrder: number;
  colorHex: string;
}

export interface EmotionSticker {
  id: number;
  code: string;
  nameKo: string;
  imageUrl: string;
  isDefault: boolean;
  isPremium: boolean;
  category: EmotionCategory;
}

export interface EmotionInfo {
  primarySticker: EmotionSticker | null;
  emotionScore: number;
  secondaryTags: string[];
}

export interface CalendarDayEntry {
  date: string;
  diaryCount: number;
  primaryEmotionCode: EmotionKey | null;
  emotionScore: number | null;
}

export interface DiaryCalendarResponseV2 {
  year: number;
  month: number;
  days: CalendarDayEntry[];
}

export interface DiaryCreateRequestV3 {
  title?: string;
  content?: string;
  diaryDate?: string;
  diaryType?: 'TEXT' | 'VISUAL' | 'MIXED';
  primaryStickerId?: number;
  primaryEmotion?: EmotionKey;
  secondaryEmotions?: string[];
  emotionScore?: number;
  theme?: string;
}

export interface DiaryV3 extends Diary {
  diaryType?: string;
  theme?: string;
  emotion?: EmotionInfo | null;
  photos?: DiaryPhoto[];
  decorations?: DiaryDecorationPlacement[];
}

export interface DiaryPhoto {
  id: number;
  cdnUrl: string;
  displayOrder: number;
}

export interface DiaryDecorationPlacement {
  id: number;
  assetType: string;
  positionX: number;
  positionY: number;
  scale: number;
  rotation: number;
}

export type DiaryStackParamListV3 = {
  DiaryListHome: undefined;
  EmotionPicker: { preselectedEmotion?: EmotionKey; returnTo?: string };
  WriteDiary: { editDiaryId?: number; selectedEmotion?: EmotionKey; selectedStickerId?: number; secondaryTags?: string[] };
  DiaryDetail: { diaryId: number };
  AIComment: { diaryId: number };
};

export type MainStackParamListV3 = MainStackParamList & {
  EmotionCalendar: undefined;
};
