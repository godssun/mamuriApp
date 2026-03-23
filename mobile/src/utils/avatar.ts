import { Platform } from 'react-native';

const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

// EXPO_PUBLIC_IMAGE_OVERRIDE: 로컬 개발 중 프로덕션 이미지 서버 테스트용 임시 오버라이드
const IMAGE_OVERRIDE = process.env.EXPO_PUBLIC_IMAGE_OVERRIDE;

const IMAGE_BASE_URL = IMAGE_OVERRIDE
  ? IMAGE_OVERRIDE
  : __DEV__
    ? `http://${DEV_HOST}:8080`
    : 'https://api.mamuri.app';

/**
 * Converts an avatar path/URL to a fully qualified image URI.
 * Returns null if the avatar is empty or invalid.
 */
export function getAvatarImageUri(avatar: string | null | undefined): string | null {
  if (!avatar || avatar.length === 0) return null;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('/uploads/')) {
    return `${IMAGE_BASE_URL}${avatar}`;
  }
  return null;
}
