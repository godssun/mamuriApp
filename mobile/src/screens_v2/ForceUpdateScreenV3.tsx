/**
 * ForceUpdateScreenV3 — 강제 업데이트 차단 화면.
 *
 * - 닫기/건너뛰기 버튼 없음. "업데이트" 버튼 한 개만 제공.
 * - 버튼을 누르면 플랫폼별 스토어 URL을 Linking으로 오픈.
 * - 네트워크 에러 시에도 재시도 UI는 넣지 않는다(강제 업데이트 대상이면 사용 자체를 막아야 함).
 *   스토어 URL이 비어 있는 예외 상황에만 App Store/Play Store 공식 웹 URL로 fallback.
 */

import React from 'react';
import { View, Text, StyleSheet, Linking, Platform, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily, spacing } from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import { ScrapbookButton } from '../design-system-v3/components/ScrapbookButton';
import { useVersionGate } from '../contexts/VersionGateContext';

const FALLBACK_URL = {
  ios: 'https://apps.apple.com/app/id6760908812',
  android: 'https://play.google.com/store/apps/details?id=com.junsapps.mamuri',
} as const;

export default function ForceUpdateScreenV3() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { storeUrl, serverMessage } = useVersionGate();

  const handleUpdate = async () => {
    const platformKey = Platform.OS === 'ios' ? 'ios' : 'android';
    const primary = storeUrl || '';
    const fallback = FALLBACK_URL[platformKey];

    try {
      if (primary && (await Linking.canOpenURL(primary))) {
        await Linking.openURL(primary);
        return;
      }
    } catch {
      // fallback으로 진행
    }

    try {
      await Linking.openURL(fallback);
    } catch {
      Alert.alert(t('forceUpdate.errorTitle'), t('forceUpdate.errorBody'));
    }
  };

  const message = serverMessage && serverMessage.trim().length > 0
    ? serverMessage
    : t('forceUpdate.defaultMessage');

  return (
    <PaperBackground
      variant="plain"
      color="warm"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        backgroundColor: colors.bgWarm,
      }}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{t('forceUpdate.title')}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>

        <View style={styles.footer}>
          <ScrapbookButton
            title={t('forceUpdate.button')}
            variant="filled"
            onPress={handleUpdate}
          />
        </View>
      </View>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontFamily: fontFamily.sans,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  footer: {
    paddingBottom: spacing['2xl'],
  },
});
