import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import i18n from '../i18n/i18n';
import {
  ApiResponse,
  TokenResponse,
  SignupRequest,
  LoginRequest,
  SocialLoginRequest,
  SocialLoginResponse,
  Diary,
  DiaryCreateRequest,
  DiaryUpdateRequest,
  DiaryCalendarResponse,
  DiaryCalendarResponseV2,
  DiaryCreateRequestV3,
  DiaryV3,
  AiComment,
  UserSettings,
  CompanionProfile,
  CompanionUpdateRequest,
  CompanionSettings,
  CompanionSettingsUpdateRequest,
  SubscriptionInfo,
  StreakResponse,
  ConversationHistoryResponse,
  ConversationReplyResponse,
  DeleteAccountRequest,
  ReportRequest,
  EmotionCategory,
  EmotionSticker,
} from '../types';

// Android 에뮬레이터에서는 10.0.2.2가 호스트 머신의 localhost
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

// EXPO_PUBLIC_API_OVERRIDE: 로컬 개발 중 프로덕션 서버 테스트용 임시 오버라이드
const API_OVERRIDE = process.env.EXPO_PUBLIC_API_OVERRIDE;

const BASE_URL = API_OVERRIDE
  ? API_OVERRIDE
  : __DEV__
    ? `http://${DEV_HOST}:8080/api`
    : 'https://api.mamuri.app/api';

const TOKEN_KEY = 'auth_tokens';
const AI_CONSENT_KEY = 'ai_data_consent';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

// 토큰 저장/조회
export const tokenStorage = {
  async save(tokens: StoredTokens): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
  },

  async get(): Promise<StoredTokens | null> {
    const data = await SecureStore.getItemAsync(TOKEN_KEY);
    return data ? JSON.parse(data) : null;
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

// AI 데이터 처리 동의 캐시
export const consentStorage = {
  async get(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(AI_CONSENT_KEY);
    return val === 'true';
  },
  async save(accepted: boolean): Promise<void> {
    await SecureStore.setItemAsync(AI_CONSENT_KEY, String(accepted));
  },
  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(AI_CONSENT_KEY);
  },
};

// API 에러 클래스
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public isUnauthorized: boolean = false,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// forceLogout 콜백 (React 트리 바깥에서 인증 상태 제어)
let forceLogoutHandler: (() => void) | null = null;

export function setForceLogoutHandler(handler: () => void): void {
  forceLogoutHandler = handler;
}

export function clearForceLogoutHandler(): void {
  forceLogoutHandler = null;
}

// 토큰 갱신 (동시 401 시 단일 갱신 보장)
let refreshPromise: Promise<TokenResponse> | null = null;

async function refreshAccessToken(): Promise<TokenResponse> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const currentTokens = await tokenStorage.get();
      if (!currentTokens?.refreshToken) {
        throw new ApiError(i18n.t('error.noRefreshToken'), 401, true);
      }

      // request() 대신 직접 fetch 사용 (무한 루프 방지)
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentTokens.refreshToken }),
      });

      const text = await response.text();
      const json: ApiResponse<TokenResponse> = text
        ? JSON.parse(text)
        : { success: false, data: null, message: null };

      if (!response.ok || !json.success || !json.data) {
        throw new ApiError(
          json.message || i18n.t('error.tokenRefreshFailed'),
          response.status,
          true
        );
      }

      await tokenStorage.save(json.data);
      return json.data;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// 기본 fetch 래퍼
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = true,
  _isRetry: boolean = false
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept-Language': i18n.language,
    ...options.headers,
  };

  if (requireAuth) {
    const tokens = await tokenStorage.get();
    if (tokens?.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${tokens.accessToken}`;
    }
  }

  // 타임아웃 (15초)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(i18n.t('error.timeout'), 408, false, 'TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await response.text();
  let json: ApiResponse<T>;
  try {
    json = text ? JSON.parse(text) : { success: false, data: null, message: null };
  } catch {
    throw new ApiError(
      i18n.t('error.parseError'),
      response.status,
      response.status === 401
    );
  }

  // 401 인터셉터
  if (response.status === 401) {
    const message = json.message || '';

    // TOKEN_REUSE_DETECTED → 즉시 로그아웃
    if (message.includes('재사용')) {
      await tokenStorage.clear();
      forceLogoutHandler?.();
      throw new ApiError(message, 401, true, 'TOKEN_REUSE_DETECTED');
    }

    // 첫 시도 + 인증 필요 요청 → 토큰 갱신 후 재시도
    if (!_isRetry && requireAuth) {
      try {
        await refreshAccessToken();
        return request<T>(endpoint, options, requireAuth, true);
      } catch {
        await tokenStorage.clear();
        forceLogoutHandler?.();
        throw new ApiError(
          message || i18n.t('error.authExpired'),
          401,
          true
        );
      }
    }

    // 재시도 후에도 401 → 로그아웃
    await tokenStorage.clear();
    forceLogoutHandler?.();
    throw new ApiError(
      message || '인증이 만료되었습니다. 다시 로그인해주세요.',
      401,
      true
    );
  }

  if (!response.ok || !json.success) {
    throw new ApiError(
      json.message || i18n.t('error.generic'),
      response.status,
      false
    );
  }

  return json.data as T;
}

// multipart/form-data 요청 (이미지 업로드 등)
async function requestMultipart<T>(
  endpoint: string,
  formData: FormData,
  _isRetry: boolean = false
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {};

  const tokens = await tokenStorage.get();
  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(i18n.t('error.timeout'), 408, false, 'TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await response.text();
  let json: ApiResponse<T>;
  try {
    json = text ? JSON.parse(text) : { success: false, data: null, message: null };
  } catch {
    throw new ApiError('서버 응답을 처리할 수 없습니다.', response.status, response.status === 401);
  }

  if (response.status === 401 && !_isRetry) {
    try {
      await refreshAccessToken();
      return requestMultipart<T>(endpoint, formData, true);
    } catch {
      await tokenStorage.clear();
      forceLogoutHandler?.();
      throw new ApiError('인증이 만료되었습니다. 다시 로그인해주세요.', 401, true);
    }
  }

  if (!response.ok || !json.success) {
    throw new ApiError(
      json.message || i18n.t('error.generic'),
      response.status,
      false
    );
  }

  return json.data as T;
}

// 인증 API
export const authApi = {
  async signup(data: SignupRequest): Promise<TokenResponse> {
    const tokens = await request<TokenResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);
    await tokenStorage.save(tokens);
    return tokens;
  },

  async login(data: LoginRequest): Promise<TokenResponse> {
    const tokens = await request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);
    await tokenStorage.save(tokens);
    return tokens;
  },

  async refresh(): Promise<TokenResponse> {
    return refreshAccessToken();
  },

  async logout(): Promise<void> {
    try {
      await request<void>('/auth/logout', { method: 'POST' }, true);
    } catch {
      // 서버 로그아웃 실패해도 로컬 토큰은 삭제
    }
    await tokenStorage.clear();
    await consentStorage.clear();
  },

  async socialLogin(data: SocialLoginRequest): Promise<SocialLoginResponse> {
    const response = await request<SocialLoginResponse>('/auth/social', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);
    if (!response.isNewUser && response.accessToken && response.refreshToken) {
      await tokenStorage.save({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
    }
    return response;
  },
};

// 일기 API
export const diaryApi = {
  async getList(): Promise<Diary[]> {
    return request<Diary[]>('/diaries');
  },

  async getListByMonth(year: number, month: number): Promise<Diary[]> {
    return request<Diary[]>(`/diaries?year=${year}&month=${month}`);
  },

  async getListByDate(date: string): Promise<Diary[]> {
    return request<Diary[]>(`/diaries?date=${date}`);
  },

  async getCalendar(year: number, month: number): Promise<DiaryCalendarResponse> {
    return request<DiaryCalendarResponse>(`/diaries/calendar?year=${year}&month=${month}`);
  },

  async getDetail(id: number): Promise<Diary> {
    return request<Diary>(`/diaries/${id}`);
  },

  async create(data: DiaryCreateRequest): Promise<Diary> {
    return request<Diary>('/diaries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: DiaryUpdateRequest): Promise<Diary> {
    return request<Diary>(`/diaries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    await request<void>(`/diaries/${id}`, {
      method: 'DELETE',
    });
  },

  async retryAiComment(diaryId: number): Promise<AiComment> {
    return request<AiComment>(`/diaries/${diaryId}/ai-comment/retry`, {
      method: 'POST',
    });
  },
};

// AI 친구 API
export const companionApi = {
  async getProfile(): Promise<CompanionProfile> {
    return request<CompanionProfile>('/companion');
  },

  async updateName(data: CompanionUpdateRequest): Promise<CompanionProfile> {
    return request<CompanionProfile>('/companion', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getStreak(): Promise<StreakResponse> {
    return request<StreakResponse>('/companion/streak');
  },

  async getSettings(): Promise<CompanionSettings> {
    return request<CompanionSettings>('/companion/settings');
  },

  async updateSettings(data: CompanionSettingsUpdateRequest): Promise<CompanionSettings> {
    return request<CompanionSettings>('/companion/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async uploadAvatar(imageUri: string): Promise<CompanionSettings> {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() ?? 'avatar.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);

    return requestMultipart<CompanionSettings>('/companion/avatar', formData);
  },

  async removeAvatar(): Promise<CompanionSettings> {
    return request<CompanionSettings>('/companion/avatar', {
      method: 'DELETE',
    });
  },

  async getStatus(): Promise<any> {
    return request<any>('/companion/status');
  },

  async getMessage(): Promise<{ type: string; message: string; subMessage: string | null; mood: string }> {
    return request<any>('/companion/message');
  },

  async getReturnStatus(): Promise<{ isReturning: boolean; daysAbsent: number }> {
    return request<any>('/companion/return-status');
  },
};

// 대화 API
export const conversationApi = {
  async getConversation(diaryId: number): Promise<ConversationHistoryResponse> {
    return request<ConversationHistoryResponse>(`/diaries/${diaryId}/conversation`);
  },

  async sendReply(diaryId: number, content: string): Promise<ConversationReplyResponse> {
    return request<ConversationReplyResponse>(`/diaries/${diaryId}/conversation/reply`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
};

// AI 응답 신고 API
export const reportApi = {
  async submit(report: ReportRequest): Promise<void> {
    await request<void>('/reports/ai-response', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  },
};

// 구독 API
export const subscriptionApi = {
  async getStatus(): Promise<SubscriptionInfo> {
    return request<SubscriptionInfo>('/subscription/status');
  },
};

// 계정 API
export const accountApi = {
  async deleteAccount(data: DeleteAccountRequest): Promise<void> {
    await request<void>('/user/delete-account', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// 설정 API
export const settingsApi = {
  async get(): Promise<UserSettings> {
    return request<UserSettings>('/settings');
  },

  async update(data: UserSettings): Promise<UserSettings> {
    return request<UserSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// 감정 API
export const emotionApi = {
  async record(diaryId: number, data: { primaryEmotion: string; secondaryEmotions?: string[]; emotionScore?: number }): Promise<any> {
    return request<any>(`/diaries/${diaryId}/emotion`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async get(diaryId: number): Promise<any> {
    return request<any>(`/diaries/${diaryId}/emotion`);
  },

  async getWeeklySummary(): Promise<any> {
    return request<any>('/emotions/weekly');
  },

  async getMonthlySummary(): Promise<any> {
    return request<any>('/emotions/monthly');
  },

  async getCalendar(year: number, month: number): Promise<any> {
    return request<any>(`/emotions/calendar?year=${year}&month=${month}`);
  },
};

// 기억 API
export const memoryApi = {
  async getAll(): Promise<any[]> {
    return request<any[]>('/memories');
  },

  async remove(memoryId: number): Promise<void> {
    await request<void>(`/memories/${memoryId}`, { method: 'DELETE' });
  },
};

// 푸시 알림 API
export const pushApi = {
  async register(token: string, platform: string = 'EXPO'): Promise<void> {
    await request<void>('/push/register', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    });
  },

  async unregister(token: string): Promise<void> {
    await request<void>('/push/unregister', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
};

// 스티커 API
export const stickerApi = {
  async getCategories(): Promise<EmotionCategory[]> {
    return request<EmotionCategory[]>('/stickers/categories');
  },

  async getStickers(categoryCode?: string): Promise<EmotionSticker[]> {
    const query = categoryCode ? `?category=${categoryCode}` : '';
    return request<EmotionSticker[]>(`/stickers${query}`);
  },
};

// 일기 V3 API (확장)
export const diaryApiV3 = {
  async createV3(data: DiaryCreateRequestV3): Promise<DiaryV3> {
    return request<DiaryV3>('/diaries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getDetailV3(id: number): Promise<DiaryV3> {
    return request<DiaryV3>(`/diaries/${id}`);
  },
};

// 캘린더 V2 API
export const calendarApi = {
  async getCalendarV2(year: number, month: number): Promise<DiaryCalendarResponseV2> {
    return request<DiaryCalendarResponseV2>(`/emotions/calendar?year=${year}&month=${month}`);
  },
};

// 리포트 API
export const reportApi2 = {
  async getAll(): Promise<any[]> {
    return request<any[]>('/reports');
  },

  async getDetail(reportId: number): Promise<any> {
    return request<any>(`/reports/${reportId}`);
  },

  async generateWeekly(): Promise<any> {
    return request<any>('/reports/generate', { method: 'POST' });
  },
};
