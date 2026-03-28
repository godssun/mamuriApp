/**
 * SignupScreen v3 — Warm Paper AI Companion Style
 *
 * Design: Scrapbook editorial feel, welcoming, minimal
 * - Back button in header
 * - Progressive form with clear visual hierarchy
 * - Password strength indicator
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  colors,
  fontFamily,
  spacing,
  borderRadius,
  layout,
  PaperBackground,
} from '../design-system-v3';
import { useAuth } from '../contexts/AuthContext';
import { consentStorage, settingsApi } from '../api/client';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { AuthStackParamList } from '../types';
import i18n from '../i18n/i18n';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export function SignupScreenV2({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { signup } = useAuth();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);

  // Entrance
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(contentAnim, {
      toValue: 1,
      tension: 50,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  // Password strength
  const passwordStrength = getPasswordStrength(password);

  const handleSignup = async () => {
    if (!nickname.trim() || !email.trim() || !password) {
      Alert.alert(t('common.alert'), t('common.fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('common.alert'), t('auth.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await signup({ email: email.trim(), password, nickname: nickname.trim() });
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
      // 성공 시 isNewUser=true → CompanionSetup 자동 이동
    } catch (error: any) {
      Alert.alert(t('auth.signupFailed'), error?.message || t('common.retry'));
    } finally {
      setLoading(false);
    }
  };

  const passwordError = confirmPassword && password !== confirmPassword
    ? t('auth.passwordMismatch')
    : undefined;

  return (
    <PaperBackground variant="plain" color="cream">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: layout.screenPaddingH }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { borderRadius: borderRadius.sm }]}
          >
            <Text style={{
              fontFamily: fontFamily.sansLight,
              fontSize: 22,
              color: colors.textPrimary,
            }}>
              ←
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={{
            paddingHorizontal: layout.screenPaddingH,
            paddingBottom: insets.bottom + spacing['4xl'],
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{
            opacity: contentAnim,
            transform: [{
              translateY: contentAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [24, 0],
              }),
            }],
          }}>
            {/* Title */}
            <Text style={{
              fontFamily: fontFamily.serifItalic,
              fontSize: 26,
              color: colors.textPrimary,
              marginTop: spacing.lg,
            }}>
              {t('auth.signupWelcome')}
            </Text>
            <Text style={{
              fontFamily: fontFamily.sans,
              fontSize: 15,
              lineHeight: 24,
              color: colors.textSecondary,
              marginTop: spacing.sm,
              marginBottom: spacing['3xl'],
            }}>
              {t('auth.signupSubtitle')}
            </Text>

            {/* Form */}
            <Input
              label={t('auth.nickname')}
              placeholder={t('auth.nicknamePlaceholder')}
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="none"
              containerStyle={{ marginBottom: spacing.xl }}
            />

            <Input
              label={t('auth.email')}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={{ marginBottom: spacing.xl }}
            />

            <Input
              label={t('auth.password')}
              placeholder={t('auth.passwordMinLength')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              containerStyle={{ marginBottom: spacing.sm }}
            />

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <View style={[styles.strengthRow, { marginBottom: spacing.xl }]}>
                <View style={styles.strengthBars}>
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor: i < passwordStrength.level
                            ? passwordStrength.color
                            : colors.accentSand + '20',
                          borderRadius: borderRadius.xxs,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={{
                  fontFamily: fontFamily.sans,
                  fontSize: 11,
                  lineHeight: 16,
                  color: passwordStrength.color,
                  marginLeft: spacing.sm,
                }}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}

            <Input
              label={t('auth.confirmPassword')}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              error={passwordError}
              containerStyle={{ marginBottom: spacing.xl }}
            />

            {/* AI 동의 체크박스 */}
            <TouchableOpacity
              onPress={() => setAiConsent(!aiConsent)}
              style={styles.consentRow}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, {
                borderColor: aiConsent ? colors.accentPrimary : colors.accentSand + '40',
                backgroundColor: aiConsent ? colors.accentPrimary : 'transparent',
                borderRadius: borderRadius.xs,
              }]}>
                {aiConsent && (
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>✓</Text>
                )}
              </View>
              <View style={styles.consentTextContainer}>
                <Text style={{
                  fontFamily: fontFamily.sans,
                  fontSize: 12,
                  lineHeight: 18,
                  color: colors.textPrimary,
                }}>
                  {t('auth.aiConsentCheckbox')}
                </Text>
                <Text style={{
                  fontFamily: fontFamily.sans,
                  fontSize: 11,
                  lineHeight: 16,
                  color: colors.textTertiary,
                  marginTop: 2,
                }}>
                  {t('auth.aiConsentCheckboxDesc')}
                </Text>
              </View>
            </TouchableOpacity>

            <Button
              label={t('auth.start')}
              onPress={handleSignup}
              loading={loading}
              fullWidth
              size="lg"
              disabled={!nickname || !email || !password || !!passwordError || !aiConsent}
            />

            {/* Terms */}
            <Text style={{
              fontFamily: fontFamily.sans,
              fontSize: 11,
              lineHeight: 18,
              color: colors.textTertiary,
              textAlign: 'center',
              marginTop: spacing.xl,
            }}>
              {t('auth.termsPrefix')}
              <Text
                style={{ color: colors.accentPrimary }}
                onPress={() => Linking.openURL('https://mamuri.app/terms')}
              >
                {t('auth.termsOfService')}
              </Text>
              {t('auth.termsAnd')}
              <Text
                style={{ color: colors.accentPrimary }}
                onPress={() => Linking.openURL('https://mamuri.app/privacy')}
              >
                {t('auth.privacyPolicy')}
              </Text>
              {t('auth.termsSuffix')}
            </Text>
          </Animated.View>
        </ScrollView>
      </View>
    </PaperBackground>
  );
}

function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (pw.length === 0) return { level: 0, label: '', color: '#918E86' };
  if (pw.length < 6) return { level: 1, label: i18n.t('auth.passwordWeak'), color: '#E05454' };
  if (pw.length < 8) return { level: 2, label: i18n.t('auth.passwordFair'), color: '#F0A830' };
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (score >= 2) return { level: 4, label: i18n.t('auth.passwordStrong'), color: '#4CAF7D' };
  return { level: 3, label: i18n.t('auth.passwordGood'), color: '#5B8DEF' };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  strengthBars: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 3,
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
