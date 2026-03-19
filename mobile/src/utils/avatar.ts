import { Platform } from 'react-native';

const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const IMAGE_BASE_URL = __DEV__
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
