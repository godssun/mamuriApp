import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { pushApi } from '../api/client';

/**
 * 푸시 알림 권한 요청 + 토큰 등록 훅.
 * 앱 시작 시 한 번 호출한다.
 */
export function usePushNotifications(isAuthenticated: boolean) {
  const registered = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || registered.current) return;

    (async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') return;

        const tokenData = await Notifications.getExpoPushTokenAsync();
        const expoPushToken = tokenData.data;

        if (expoPushToken) {
          await pushApi.register(expoPushToken, Platform.OS === 'ios' ? 'IOS' : 'ANDROID');
          registered.current = true;
        }
      } catch (error) {
        // 푸시 등록 실패는 무시 (기능에 영향 없음)
      }
    })();
  }, [isAuthenticated]);
}

// 알림 핸들러 설정 (앱 포그라운드에서 알림 표시)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
