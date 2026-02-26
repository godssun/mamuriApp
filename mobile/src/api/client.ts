import * as SecureStore from 'expo-secure-store';
import {
  ApiResponse,
  TokenResponse,
  SignupRequest,
  LoginRequest,
  Diary,
  DiaryCreateRequest,
  DiaryUpdateRequest,
  DiaryCalendarResponse,
  AiComment,
  UserSettings,
  CompanionProfile,
  CompanionUpdateRequest,
} from '../types';

// 개발 환경에서는 localhost, 프로덕션에서는 실제 서버 URL
const BASE_URL = __DEV__
  ? 'http://localhost:8080/api'
  : 'https://api.mamuri.app/api';

const TOKEN_KEY = 'auth_tokens';

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
        throw new ApiError('리프레시 토큰이 없습니다.', 401, true);
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
          json.message || '토큰 갱신에 실패했습니다.',
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
      throw new ApiError('요청 시간이 초과되었습니다.', 408, false, 'TIMEOUT');
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
      '서버 응답을 처리할 수 없습니다.',
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
          message || '인증이 만료되었습니다. 다시 로그인해주세요.',
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
      json.message || '요청 처리 중 오류가 발생했습니다.',
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
