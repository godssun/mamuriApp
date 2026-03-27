/**
 * SocialNicknameScreen v2 — 소셜 신규 사용자 닉네임 입력
 */

import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useThemeV2 } from '../design-system-v2';
import { useAuth } from '../contexts/AuthContext';
import { consentStorage, settingsApi } from '../api/client';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { AuthStackParamList } from '../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'SocialNickname'>;

export function SocialNicknameScreenV2({ route }: Props) {
  const { provider, token } = route.params;
  const { theme } = useThemeV2();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { completeSocialSignup } = useAuth();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);

  const handleSubmit = async () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      Alert.alert(t('common.alert'), t('auth.socialNicknameLength'));
      return;
    }
    setLoading(true);
    try {
      await completeSocialSignup(provider, token, trimmed);
      // AI 동의 저장
      await consentStorage.save(true);
      try {
        await settingsApi.update({
          aiTone: 'warm', aiEnabled: true, backgroundTheme: 'warm',
          fontFamily: 'system', fontSize: 'medium', aiDataConsent: true,
        });
      } catch {
        // 서버 동기화 실패해도 로컬 동의 유지
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || t('auth.socialLoginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, {
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    }]}>
      <View style={[styles.content, { paddingHorizontal: theme.layout.screenPaddingH }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoCircle, {
            backgroundColor: theme.colors.primarySubtle,
            borderColor: theme.colors.primaryLight,
          }]}>
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#6356D9' }} />
          </View>

          <Text style={[
            theme.typography.displayMedium,
            { color: theme.colors.textPrimary, marginTop: theme.spacing.lg },
          ]}>
            {t('auth.socialNickname')}
          </Text>

          <Text style={[
            theme.typography.bodyMedium,
            {
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.sm,
              textAlign: 'center',
            },
          ]}>
            {t('auth.socialNicknameDesc')}
          </Text>
        </View>

        {/* Form */}
        <View style={{ marginTop: theme.spacing['3xl'] }}>
          <Input
            label={t('auth.nickname')}
            placeholder={t('auth.nicknamePlaceholder')}
            value={nickname}
            onChangeText={setNickname}
            autoCapitalize="none"
            containerStyle={{ marginBottom: theme.spacing.xl }}
          />

          {/* AI 동의 체크박스 */}
          <TouchableOpacity
            onPress={() => setAiConsent(!aiConsent)}
            style={styles.consentRow}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, {
              borderColor: aiConsent ? theme.colors.primary : theme.colors.border,
              backgroundColor: aiConsent ? theme.colors.primary : 'transparent',
              borderRadius: theme.borderRadius.xs,
            }]}>
              {aiConsent && (
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>✓</Text>
              )}
            </View>
            <View style={styles.consentTextContainer}>
              <Text style={[theme.typography.bodySmall, { color: theme.colors.textPrimary }]}>
                {t('auth.aiConsentCheckbox')}
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginTop: 2 }]}>
                {t('auth.aiConsentCheckboxDesc')}
              </Text>
            </View>
          </TouchableOpacity>

          <Button
            label={t('auth.socialStart')}
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            size="lg"
            disabled={!aiConsent}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  logoEmoji: {
    fontSize: 40,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  consentTextContainer: {
    flex: 1,
  },
});
