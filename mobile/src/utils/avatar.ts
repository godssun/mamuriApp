import { Platform } from 'react-native';

/**
 * Converts an avatar path/URL to a fully qualified image URI.
 * Returns null if the avatar is empty or invalid.
 */
export function getAvatarImageUri(avatar: string | null | undefined): string | null {
  if (!avatar || avatar.length === 0) return null;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('/uploads/')) {
    const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return `http://${host}:8080${avatar}`;
  }
  return null;
}
