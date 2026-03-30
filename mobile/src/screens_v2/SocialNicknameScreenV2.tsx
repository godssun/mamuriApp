/**
 * SocialNickname v3 — Warm scrapbook nickname entry
 *
 * "이름을 붙이고 관계를 시작하는 조용한 순간"
 * Paper-textured background, serif prompts, sage accents,
 * blob logo shape, ivory form surface.
 *
 * v3 design system tokens.
 */

import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  colors, fontFamily, shadows, spacing, borderRadius, layout,
} from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import { useAuth } from '../contexts/AuthContext';
import { consentStorage, settingsApi } from '../api/client';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { AuthStackParamList } from '../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'SocialNickname'>;

export function SocialNicknameScreenV2({ route }: Props) {
  const { provider, token } = route.params;
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
      await consentStorage.save(true);
      try {
        await settingsApi.update({
          aiTone: 'warm', aiEnabled: true, backgroundTheme: 'warm',
          fontFamily: 'system', fontSize: 'medium', aiDataConsent: true,
        });
      } catch {}
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || t('auth.socialLoginFailed'));
    } finally { setLoading(false); }
  };

  return (
    <PaperBackground variant="plain" color="cream">
      <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={s.content}>
          {/* Header — warm welcome */}
          <View style={s.header}>
            <View style={s.logoCircle}>
              <View style={s.logoDot} />
            </View>

            <Text style={s.title}>{t('auth.socialNickname')}</Text>
            <Text style={s.desc}>{t('auth.socialNicknameDesc')}</Text>
          </View>

          {/* Form */}
          <View style={s.form}>
            <Input
              label={t('auth.nickname')}
              placeholder={t('auth.nicknamePlaceholder')}
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="none"
              containerStyle={{ marginBottom: spacing.xl }}
            />

            {/* AI consent */}
            <TouchableOpacity onPress={() => setAiConsent(!aiConsent)} style={s.consentRow} activeOpacity={0.7}>
              <View style={[s.checkbox, {
                borderColor: aiConsent ? colors.accentPrimary : colors.accentSand + '50',
                backgroundColor: aiConsent ? colors.accentPrimary : 'transparent',
              }]}>
                {aiConsent && <Text style={s.checkmark}>✓</Text>}
              </View>
              <View style={s.consentTextWrap}>
                <Text style={s.consentText}>{t('auth.aiConsentCheckbox')}</Text>
                <Text style={s.consentDesc}>{t('auth.aiConsentCheckboxDesc')}</Text>
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
    </PaperBackground>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: layout.screenPaddingH },

  // Header
  header: { alignItems: 'center' },
  logoCircle: {
    width: 88, height: 88,
    borderTopLeftRadius: 32, borderTopRightRadius: 38,
    borderBottomRightRadius: 34, borderBottomLeftRadius: 40,
    backgroundColor: colors.accentPrimaryLight + '30',
    borderWidth: 1.5, borderColor: colors.accentPrimaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  logoDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.accentPrimary,
  },
  title: {
    fontFamily: fontFamily.serifItalic, fontSize: 26, fontWeight: '400',
    color: colors.textPrimary, marginTop: spacing.lg,
  },
  desc: {
    fontFamily: fontFamily.sans, fontSize: 14,
    color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center',
  },

  // Form
  form: { marginTop: spacing['3xl'] },

  // Consent
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing['2xl'] },
  checkbox: {
    width: 22, height: 22, borderWidth: 2,
    borderRadius: borderRadius.xs,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  checkmark: { color: colors.surfacePure, fontSize: 12, fontWeight: '700' },
  consentTextWrap: { flex: 1 },
  consentText: { fontFamily: fontFamily.sans, fontSize: 13, color: colors.textPrimary },
  consentDesc: { fontFamily: fontFamily.sans, fontSize: 11, color: colors.textTertiary, marginTop: 2 },
});
