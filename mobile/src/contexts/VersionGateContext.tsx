import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { appApi } from '../api/client';

/**
 * 앱 강제 업데이트 게이트.
 *
 * 부팅 시 서버의 최소 지원 버전을 조회해 미달이면 ForceUpdate 화면으로 차단한다.
 * 서버 조회 실패 시에는 반드시 통과(fail-open)시킨다 — 버전 체크 때문에
 * 앱 전체가 잠기는 사고를 막는 것이 강제 업데이트보다 우선이다.
 */
interface VersionGateState {
  isChecking: boolean;
  forceUpdateRequired: boolean;
  storeUrl: string;
  serverMessage: string;
}

const VersionGateContext = createContext<VersionGateState>({
  isChecking: true,
  forceUpdateRequired: false,
  storeUrl: '',
  serverMessage: '',
});

export function VersionGateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<VersionGateState>({
    isChecking: true,
    forceUpdateRequired: false,
    storeUrl: '',
    serverMessage: '',
  });

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        const currentVersion = Constants.expoConfig?.version ?? '0.0.0';
        const res = await appApi.checkVersion(platform, currentVersion);
        if (cancelled) return;
        setState({
          isChecking: false,
          forceUpdateRequired: res.forceUpdate === true,
          storeUrl: res.storeUrl ?? '',
          serverMessage: res.message ?? '',
        });
      } catch {
        if (cancelled) return;
        // fail-open: 네트워크/서버 오류 시 차단하지 않는다
        setState({
          isChecking: false,
          forceUpdateRequired: false,
          storeUrl: '',
          serverMessage: '',
        });
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return <VersionGateContext.Provider value={state}>{children}</VersionGateContext.Provider>;
}

export function useVersionGate() {
  return useContext(VersionGateContext);
}
