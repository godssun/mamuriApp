/**
 * CustomStickerContext — 커스텀 스티커 저장 및 관리
 *
 * 사용자가 사진으로 만든 커스텀 스티커를 로컬에 저장하고,
 * 에디터에서 재사용할 수 있도록 관리합니다.
 *
 * MVP 저장소: AsyncStorage (로컬)
 * 향후: 서버 동기화 + CDN 업로드
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
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

export function CustomStickerProvider({ children }: { children: React.ReactNode }) {
  const [stickers, setStickers] = useState<CustomSticker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStickers = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const parsed = JSON.parse(json) as CustomSticker[];
        // 파일 존재 여부 확인하고 깨진 항목 제거
        const valid: CustomSticker[] = [];
        for (const s of parsed) {
          const info = await FileSystem.getInfoAsync(s.stickerUri);
          if (info.exists) valid.push(s);
        }
        setStickers(valid);
        if (valid.length !== parsed.length) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
        }
      }
    } catch {
      // 로딩 실패 시 빈 배열 유지
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadStickers(); }, [loadStickers]);

  const addSticker = useCallback(async (input: Omit<CustomSticker, 'id' | 'createdAt'>): Promise<CustomSticker> => {
    // 스티커 디렉토리 보장
    const dirInfo = await FileSystem.getInfoAsync(STICKER_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(STICKER_DIR, { intermediates: true });
    }

    const id = `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const ext = input.stickerUri.split('.').pop() || 'png';
    const localUri = `${STICKER_DIR}${id}.${ext}`;

    // 스티커 파일을 앱 전용 디렉토리로 복사
    await FileSystem.copyAsync({ from: input.stickerUri, to: localUri });

    const sticker: CustomSticker = {
      ...input,
      id,
      stickerUri: localUri,
      createdAt: new Date().toISOString(),
    };

    const updated = [sticker, ...stickers];
    setStickers(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return sticker;
  }, [stickers]);

  const removeSticker = useCallback(async (id: string) => {
    const target = stickers.find(s => s.id === id);
    if (target) {
      await FileSystem.deleteAsync(target.stickerUri, { idempotent: true });
    }
    const updated = stickers.filter(s => s.id !== id);
    setStickers(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [stickers]);

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
