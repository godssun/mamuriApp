/**
 * CustomStickerContext — 커스텀 스티커 저장 및 관리
 *
 * 서버를 source of truth로 하되, 로컬(AsyncStorage + 파일 캐시)을 오프라인 캐시로 사용한다.
 *
 * - 로드: 로컬 캐시를 먼저 표시(오프라인 허용) → 로그인 상태면 서버 목록과 동기화.
 * - 생성: 서버 업로드 후 로컬 캐시. 업로드 실패 시에도 로컬로 저장(다음 로드에서 재업로드 시도).
 * - 삭제: 서버 + 로컬 모두 삭제.
 * - 마이그레이션: serverId 없는 기존 로컬 스티커는 로드 시 1회 업로드 시도(실패해도 로컬 유지).
 *
 * 스티커 id는 반드시 `cs_` 프리픽스를 유지한다(에디터의 커스텀 스티커 판별 로직 의존).
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { customStickerApi, tokenStorage, type CustomStickerServer } from '../api/client';
import { getAvatarImageUri } from '../utils/avatar';
import type { CustomSticker } from '../types';

const STORAGE_KEY = '@mamuri_custom_stickers';
const STICKER_DIR = `${FileSystem.documentDirectory}custom_stickers/`;

interface CustomStickerContextType {
  stickers: CustomSticker[];
  isLoading: boolean;
  /** 새 커스텀 스티커 추가 */
  addSticker: (sticker: Omit<CustomSticker, 'id' | 'createdAt'>) => Promise<CustomSticker>;
  /** 스티커 삭제 */
  removeSticker: (id: string) => Promise<void>;
  /** 전체 스티커 새로고침 */
  refresh: () => Promise<void>;
}

const CustomStickerContext = createContext<CustomStickerContextType | undefined>(undefined);

async function ensureDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(STICKER_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(STICKER_DIR, { intermediates: true });
  }
}

async function isLoggedIn(): Promise<boolean> {
  try {
    const tokens = await tokenStorage.get();
    return !!tokens?.accessToken;
  } catch {
    return false;
  }
}

/** 서버 스티커를 로컬 파일로 다운로드하여 캐시한다. 실패 시 null. */
async function cacheRemote(server: CustomStickerServer): Promise<string | null> {
  const absolute = getAvatarImageUri(server.url);
  if (!absolute) return null;
  try {
    await ensureDir();
    const ext = (absolute.split('?')[0].split('.').pop() || 'png').toLowerCase();
    const safeExt = ['png', 'jpg', 'jpeg', 'webp'].includes(ext) ? ext : 'png';
    const localUri = `${STICKER_DIR}cs_srv_${server.id}.${safeExt}`;
    const result = await FileSystem.downloadAsync(absolute, localUri);
    return result.uri;
  } catch {
    return null;
  }
}

function buildFromServer(server: CustomStickerServer, localUri: string): CustomSticker {
  const border = (server.borderStyle as CustomSticker['borderStyle']) ?? 'none';
  return {
    id: `cs_srv_${server.id}`,
    originalUri: localUri,
    stickerUri: localUri,
    thumbnailUri: localUri,
    createdAt: server.createdAt,
    width: server.width ?? 200,
    height: server.height ?? 200,
    borderStyle: border,
    serverId: server.id,
    remoteUrl: server.url,
    isCutout: server.borderStyle == null,
  };
}

export function CustomStickerProvider({ children }: { children: React.ReactNode }) {
  const [stickers, setStickers] = useState<CustomSticker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /** AsyncStorage에서 로컬 캐시를 읽고 파일이 존재하는 항목만 반환. */
  const readLocal = useCallback(async (): Promise<CustomSticker[]> => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) return [];
      const parsed = JSON.parse(json) as CustomSticker[];
      const valid: CustomSticker[] = [];
      for (const s of parsed) {
        const info = await FileSystem.getInfoAsync(s.stickerUri);
        if (info.exists) valid.push(s);
      }
      return valid;
    } catch {
      return [];
    }
  }, []);

  const persist = useCallback(async (list: CustomSticker[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, []);

  /** 로컬 + 서버를 동기화한다(서버가 source of truth). */
  const reconcile = useCallback(async (
    local: CustomSticker[],
    server: CustomStickerServer[],
  ): Promise<CustomSticker[]> => {
    const result: CustomSticker[] = [];
    const serverIds = new Set(server.map((s) => s.id));

    // 1) 서버 스티커 → 로컬 캐시 확보
    for (const sv of server) {
      const existing = local.find((l) => l.serverId === sv.id);
      if (existing) {
        const info = await FileSystem.getInfoAsync(existing.stickerUri);
        if (info.exists) {
          result.push({ ...existing, remoteUrl: sv.url });
          continue;
        }
      }
      const localUri = await cacheRemote(sv);
      if (localUri) result.push(buildFromServer(sv, localUri));
    }

    // 2) serverId 없는 로컬 전용 스티커 → 1회 업로드 시도(마이그레이션)
    for (const l of local) {
      if (l.serverId) continue; // 서버 매칭은 위에서 처리됨
      try {
        const uploaded = await customStickerApi.upload(l.stickerUri, {
          width: l.width,
          height: l.height,
          borderStyle: l.borderStyle,
        });
        result.push({ ...l, serverId: uploaded.id, remoteUrl: uploaded.url });
      } catch {
        result.push(l); // 실패해도 로컬로 계속 표시
      }
    }

    // 3) 서버에서 삭제된(과거 serverId 보유) 로컬 스티커의 orphan 파일 정리
    for (const l of local) {
      if (l.serverId && !serverIds.has(l.serverId)) {
        await FileSystem.deleteAsync(l.stickerUri, { idempotent: true });
      }
    }

    // 최신순 정렬
    result.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return result;
  }, []);

  const loadStickers = useCallback(async () => {
    setIsLoading(true);
    const local = await readLocal();
    setStickers(local); // 즉시 표시 (오프라인 허용)

    if (!(await isLoggedIn())) {
      setIsLoading(false);
      return;
    }

    try {
      const server = await customStickerApi.list();
      const merged = await reconcile(local, server);
      setStickers(merged);
      await persist(merged);
    } catch {
      // 서버 동기화 실패 시 로컬 유지
    } finally {
      setIsLoading(false);
    }
  }, [readLocal, reconcile, persist]);

  useEffect(() => { loadStickers(); }, [loadStickers]);

  const addSticker = useCallback(async (
    input: Omit<CustomSticker, 'id' | 'createdAt'>,
  ): Promise<CustomSticker> => {
    await ensureDir();

    const id = `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const ext = input.stickerUri.split('?')[0].split('.').pop() || 'png';
    const localUri = `${STICKER_DIR}${id}.${ext}`;

    // 스티커 파일을 앱 전용 디렉토리로 복사
    await FileSystem.copyAsync({ from: input.stickerUri, to: localUri });

    // 서버 업로드 시도 (실패해도 로컬 저장 — 다음 로드에서 재업로드)
    let serverId: number | undefined;
    let remoteUrl: string | undefined;
    if (await isLoggedIn()) {
      try {
        const uploaded = await customStickerApi.upload(localUri, {
          width: input.width,
          height: input.height,
          borderStyle: input.borderStyle,
        });
        serverId = uploaded.id;
        remoteUrl = uploaded.url;
      } catch {
        // 오프라인/일시적 실패 — 로컬로만 저장
      }
    }

    const sticker: CustomSticker = {
      ...input,
      id,
      stickerUri: localUri,
      createdAt: new Date().toISOString(),
      serverId,
      remoteUrl,
    };

    const updated = [sticker, ...stickers];
    setStickers(updated);
    await persist(updated);
    return sticker;
  }, [stickers, persist]);

  const removeSticker = useCallback(async (id: string) => {
    const target = stickers.find((s) => s.id === id);

    // 서버 삭제 시도 (실패해도 로컬 삭제는 진행)
    if (target?.serverId && (await isLoggedIn())) {
      try {
        await customStickerApi.delete(target.serverId);
      } catch {
        // 서버 삭제 실패는 무시 — 로컬에서 제거
      }
    }

    if (target) {
      await FileSystem.deleteAsync(target.stickerUri, { idempotent: true });
    }
    const updated = stickers.filter((s) => s.id !== id);
    setStickers(updated);
    await persist(updated);
  }, [stickers, persist]);

  return (
    <CustomStickerContext.Provider value={{ stickers, isLoading, addSticker, removeSticker, refresh: loadStickers }}>
      {children}
    </CustomStickerContext.Provider>
  );
}

export function useCustomStickers() {
  const context = useContext(CustomStickerContext);
  if (!context) throw new Error('useCustomStickers must be used within CustomStickerProvider');
  return context;
}
