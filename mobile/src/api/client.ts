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
    public isUnauthorized: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 기본 fetch 래퍼
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = true
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

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    const isUnauthorized = response.status === 401;
    throw new ApiError(
      json.message || '요청 처리 중 오류가 발생했습니다.',
      response.status,
      isUnauthorized
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
    const currentTokens = await tokenStorage.get();
    if (!currentTokens?.refreshToken) {
      throw new ApiError('리프레시 토큰이 없습니다.', 401, true);
    }

    const tokens = await request<TokenResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: currentTokens.refreshToken }),
    }, false);
    await tokenStorage.save(tokens);
    return tokens;
  },

  async logout(): Promise<void> {
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
