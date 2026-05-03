import { Platform } from 'react-native';

export type KAVBehavior = 'padding' | 'height' | 'position' | undefined;

/**
 * KeyboardAvoidingView behavior 결정 헬퍼.
 *
 * - iOS는 항상 'padding'.
 * - Android는 일반 화면이면 undefined로 두어 AndroidManifest의
 *   android:windowSoftInputMode="adjustResize"에 위임한다.
 *   (KAV padding과 adjustResize가 동시에 동작하면 이중 보정으로
 *    레이아웃이 어긋난다.)
 * - Android 모달은 RN <Modal>이 별도 윈도우라 adjustResize가 적용되지
 *   않으므로 'padding'이 필요하다.
 */
export function getKAVBehavior(isModal: boolean): KAVBehavior {
  if (Platform.OS === 'ios') return 'padding';
  return isModal ? 'padding' : undefined;
}
