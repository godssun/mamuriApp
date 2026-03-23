/**
 * 소셜 인증 서비스 — Google, Apple SDK 래퍼
 *
 * Google/Apple → Firebase Auth SDK → Firebase ID Token
 *
 * 네이티브 모듈이 없는 환경(Expo Go)에서는 graceful하게 비활성화됨.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// --- 네이티브 모듈 lazy loading ---
// Expo Go에서는 네이티브 모듈이 없으므로 require()를 try-catch로 감싸서
// 앱 크래시를 방지한다.

let firebaseAuth: any = null;
let GoogleSignin: any = null;
let AppleAuthentication: any = null;
let Crypto: any = null;

let _nativeModulesAvailable = false;

try {
  firebaseAuth = require('@react-native-firebase/auth').default;
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  AppleAuthentication = require('expo-apple-authentication');
  Crypto = require('expo-crypto');

  // Google Sign-In 설정 — app.config.ts의 extra에서 webClientId를 가져옴
  // process.env는 EAS 릴리스 빌드에서 사용할 수 없으므로 Constants.expoConfig.extra 사용
  const webClientId = Constants.expoConfig?.extra?.googleWebClientId || '';
  GoogleSignin.configure({ webClientId });

  _nativeModulesAvailable = true;
} catch {
  // 네이티브 모듈 없음 (Expo Go 환경) → 소셜 로그인 비활성화
  _nativeModulesAvailable = false;
}

/**
 * 소셜 로그인 네이티브 모듈이 사용 가능한지 반환.
 * Expo Go에서는 false, dev client / 프로덕션 빌드에서는 true.
 */
export function isSocialAuthAvailable(): boolean {
  return _nativeModulesAvailable;
}

export interface SocialAuthResult {
  token: string;
  provider: 'GOOGLE' | 'APPLE';
}

/**
 * Google 로그인 → Firebase ID Token 반환
 */
export async function signInWithGoogle(): Promise<SocialAuthResult> {
  if (!_nativeModulesAvailable) {
    throw new Error('Social login requires a native build (expo prebuild or EAS Build)');
  }

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  if (!response.data?.idToken) {
    throw new Error('Google sign-in failed: no ID token');
  }

  const googleCredential = firebaseAuth.GoogleAuthProvider.credential(response.data.idToken);
  const userCredential = await firebaseAuth().signInWithCredential(googleCredential);
  const firebaseIdToken = await userCredential.user.getIdToken();

  return { token: firebaseIdToken, provider: 'GOOGLE' };
}

/**
 * Apple 로그인 → Firebase ID Token 반환 (iOS only)
 */
export async function signInWithApple(): Promise<SocialAuthResult> {
  if (!_nativeModulesAvailable) {
    throw new Error('Social login requires a native build (expo prebuild or EAS Build)');
  }

  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In is only available on iOS');
  }

  const nonce = Math.random().toString(36).substring(2, 10);
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    nonce
  );

  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!appleCredential.identityToken) {
    throw new Error('Apple sign-in failed: no identity token');
  }

  const oAuthCredential = firebaseAuth.AppleAuthProvider.credential(
    appleCredential.identityToken,
    nonce
  );
  const userCredential = await firebaseAuth().signInWithCredential(oAuthCredential);
  const firebaseIdToken = await userCredential.user.getIdToken();

  return { token: firebaseIdToken, provider: 'APPLE' };
}

/**
 * 모든 소셜 SDK에서 로그아웃
 */
export async function signOutFromProviders(): Promise<void> {
  if (!_nativeModulesAvailable) return;

  try {
    if (firebaseAuth().currentUser) {
      await firebaseAuth().signOut();
    }
  } catch {
    // Firebase sign-out 실패 무시
  }

  try {
    const isSignedIn = await GoogleSignin.getCurrentUser();
    if (isSignedIn) {
      await GoogleSignin.signOut();
    }
  } catch {
    // Google sign-out 실패 무시
  }
}

/**
 * 사용자 취소 에러인지 확인
 */
export function isCancelledError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('cancel') ||
      message.includes('err_canceled') ||
      message.includes('sign_in_cancelled') ||
      (error as any).code === 'ERR_CANCELED' ||
      (error as any).code === '1001'
    );
  }
  return false;
}
