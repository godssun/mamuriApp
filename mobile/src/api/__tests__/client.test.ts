import { ApiError, tokenStorage, diaryApi, setForceLogoutHandler, clearForceLogoutHandler } from '../client';

// expo-secure-store mock
jest.mock('expo-secure-store', () => {
  let store: Record<string, string> = {};
  return {
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete store[key];
    }),
    __resetStore: () => { store = {}; },
  };
});

const SecureStore = require('expo-secure-store');

// global.fetch mock
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// __DEV__ 설정
(global as any).__DEV__ = true;

function jsonResponse(status: number, body: { success: boolean; data: unknown; message: string | null }) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

beforeEach(async () => {
  jest.clearAllMocks();
  SecureStore.__resetStore();
  clearForceLogoutHandler();
  // 기본 토큰 세팅
  await tokenStorage.save({ accessToken: 'access-1', refreshToken: 'refresh-1' });
});

describe('API Client 토큰 갱신 인터셉터', () => {
  it('401 → 자동 갱신 → 재시도 성공', async () => {
    // 1차: 401 응답
    mockFetch.mockImplementationOnce(() =>
      jsonResponse(401, { success: false, data: null, message: '토큰이 만료되었습니다.' })
    );
    // 2차: refresh 성공
    mockFetch.mockImplementationOnce(() =>
      jsonResponse(200, {
        success: true,
        data: { accessToken: 'access-2', refreshToken: 'refresh-2' },
        message: null,
      })
    );
    // 3차: 재시도 성공
    mockFetch.mockImplementationOnce(() =>
      jsonResponse(200, {
        success: true,
        data: [{ id: 1, title: '테스트 일기' }],
        message: null,
      })
    );

    const result = await diaryApi.getList();

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result).toEqual([{ id: 1, title: '테스트 일기' }]);

    // 토큰이 갱신되었는지 확인
    const tokens = await tokenStorage.get();
    expect(tokens?.accessToken).toBe('access-2');
  });

  it('TOKEN_REUSE_DETECTED → 즉시 로그아웃', async () => {
    const forceLogout = jest.fn();
    setForceLogoutHandler(forceLogout);

    mockFetch.mockImplementationOnce(() =>
      jsonResponse(401, {
        success: false,
        data: null,
        message: '토큰이 재사용되었습니다.',
      })
    );

    await expect(diaryApi.getList()).rejects.toThrow(ApiError);

    try {
      await diaryApi.getList();
    } catch {
      // 이미 위에서 테스트
    }

    expect(forceLogout).toHaveBeenCalled();
    const tokens = await tokenStorage.get();
    expect(tokens).toBeNull();
  });

  it('동시 401 → 단일 갱신만 수행', async () => {
    // 두 요청 모두 401
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/auth/refresh')) {
        return jsonResponse(200, {
          success: true,
          data: { accessToken: 'access-new', refreshToken: 'refresh-new' },
          message: null,
        });
      }
      // 첫 호출은 401, 재시도는 성공
      const callCount = mockFetch.mock.calls.filter(
        (c: string[]) => c[0] === url
      ).length;
      if (callCount <= 1) {
        return jsonResponse(401, { success: false, data: null, message: '만료' });
      }
      return jsonResponse(200, { success: true, data: [], message: null });
    });

    const [result1, result2] = await Promise.all([
      diaryApi.getList(),
      diaryApi.getList(),
    ]);

    expect(result1).toEqual([]);
    expect(result2).toEqual([]);

    // refresh 호출 횟수 확인 (1회만)
    const refreshCalls = mockFetch.mock.calls.filter(
      (call: [string]) => call[0].includes('/auth/refresh')
    );
    expect(refreshCalls.length).toBe(1);
  });

  it('갱신 실패 → 로그아웃', async () => {
    const forceLogout = jest.fn();
    setForceLogoutHandler(forceLogout);

    // 원본 401
    mockFetch.mockImplementationOnce(() =>
      jsonResponse(401, { success: false, data: null, message: '만료' })
    );
    // refresh 실패
    mockFetch.mockImplementationOnce(() =>
      jsonResponse(401, { success: false, data: null, message: '리프레시 토큰 만료' })
    );

    await expect(diaryApi.getList()).rejects.toThrow(ApiError);
    expect(forceLogout).toHaveBeenCalled();
    const tokens = await tokenStorage.get();
    expect(tokens).toBeNull();
  });

  it('비-401 에러 → 그대로 전달, forceLogout 미호출', async () => {
    const forceLogout = jest.fn();
    setForceLogoutHandler(forceLogout);

    mockFetch.mockImplementationOnce(() =>
      jsonResponse(500, { success: false, data: null, message: '서버 에러' })
    );

    await expect(diaryApi.getList()).rejects.toThrow('서버 에러');
    expect(forceLogout).not.toHaveBeenCalled();
  });

  it('타임아웃 → TIMEOUT 에러', async () => {
    // fetch가 AbortError를 직접 throw하도록 mock
    mockFetch.mockImplementationOnce(() => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    await expect(diaryApi.getList()).rejects.toMatchObject({
      name: 'ApiError',
      code: 'TIMEOUT',
      status: 408,
    });
  });
});
