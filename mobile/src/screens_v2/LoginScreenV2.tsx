/**
 * LoginScreen v3 — Warm scrapbook entrance
 *
 * "Welcome 다음에 자연스럽게 이어지는 조용한 입구"
 * Paper-textured background, serif app name,
 * cream form cards, sage accents — not a SaaS login.
 *
 * v3 design system tokens. No react-native-svg.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Animated,
  Alert, Platform, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';
import { changeLanguage, SupportedLanguage } from '../i18n/i18n';
import {
  colors, fontFamily, shadows, spacing, borderRadius, layout, duration,
} from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { AuthStackParamList, SocialProvider } from '../types';
import {
  signInWithGoogle, signInWithApple, isCancelledError, isSocialAuthAvailable,
} from '../services/socialAuth';

const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'EN' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
];

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreenV2({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { login, socialLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);

  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.spring(logoAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(formAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(footerAnim, { toValue: 1, tension: 40, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSocialLogin = async (signInFn: () => Promise<{ token: string; provider: SocialProvider }>) => {
    const provider = signInFn === signInWithGoogle ? 'GOOGLE' as const : 'APPLE' as const;
    setSocialLoading(provider);
    try {
      const result = await signInFn();
      const response = await socialLogin(result.provider, result.token);
      if (response.isNewUser) {
        navigation.navigate('SocialNickname', { provider: result.provider, token: result.token });
      }
    } catch (error: unknown) {
      if (isCancelledError(error)) return;
      Alert.alert(t('common.error'), (error instanceof Error ? error.message : null) || t('auth.socialLoginFailed'));
    } finally { setSocialLoading(null); }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.alert'), t('common.fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (error: any) {
      Alert.alert(t('auth.loginFailed'), error?.message || t('auth.loginFailedMessage'));
    } finally { setLoading(false); }
  };

  return (
    <PaperBackground variant="plain" color="cream">
      <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Language Selector — subtle pills */}
        <View style={s.languageRow}>
          {LANGUAGES.map((lang) => {
            const isActive = i18n.language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[s.langChip, isActive && s.langChipActive]}
                onPress={() => changeLanguage(lang.code)}
              >
                <Text style={[s.langText, isActive && s.langTextActive]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logo & Welcome */}
        <Animated.View style={[
          s.logoSection,
          {
            opacity: logoAnim,
            transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          },
        ]}>
          <Image source={require('../../assets/splash-icon.png')} style={s.appIcon} />
          <Text style={s.appName}>{t('auth.appName')}</Text>
          <Text style={s.welcomeText}>{t('auth.welcome')}</Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={[
          s.formSection,
          {
            opacity: formAnim,
            transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
          },
        ]}>
          <Input
            label={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={{ marginBottom: spacing.lg }}
          />

          <Input
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={s.showPwText}>
                  {showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                </Text>
              </TouchableOpacity>
            }
            containerStyle={{ marginBottom: spacing['2xl'] }}
          />

          <Button label={t('auth.login')} onPress={handleLogin} loading={loading} fullWidth size="lg" />

          <TouchableOpacity style={s.forgotBtn}>
            <Text style={s.forgotText}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[s.footer, { opacity: footerAnim }]}>
          {isSocialAuthAvailable() && (
            <>
              <View style={s.dividerRow}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>{t('auth.or')}</Text>
                <View style={s.dividerLine} />
              </View>

              <View style={s.socialBtns}>
                <TouchableOpacity
                  style={s.socialBtn}
                  onPress={() => handleSocialLogin(signInWithGoogle)}
                  disabled={socialLoading !== null}
                >
                  <AntDesign name="google" size={18} color="#4285F4" />
                  <Text style={s.socialBtnText}>
                    {socialLoading === 'GOOGLE' ? '...' : t('auth.socialGoogle')}
                  </Text>
                </TouchableOpacity>

                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={s.socialBtnDark}
                    onPress={() => handleSocialLogin(signInWithApple)}
                    disabled={socialLoading !== null}
                  >
                    <Ionicons name="logo-apple" size={20} color={colors.surfacePure} />
                    <Text style={s.socialBtnDarkText}>
                      {socialLoading === 'APPLE' ? '...' : t('auth.socialApple')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          <TouchableOpacity style={s.signupRow} onPress={() => navigation.navigate('Signup')}>
            <Text style={s.signupHint}>{t('auth.noAccount')} </Text>
            <Text style={s.signupLink}>{t('auth.signup')}</Text>
          </TouchableOpacity>

          <View style={s.legalRow}>
            <TouchableOpacity onPress={() => Linking.openURL('https://mamuri.app/privacy')}>
              <Text style={s.legalText}>{t('auth.privacyPolicy')}</Text>
            </TouchableOpacity>
            <Text style={s.legalText}> · </Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://mamuri.app/terms')}>
              <Text style={s.legalText}>{t('auth.termsOfService')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </PaperBackground>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between' },

  // Language
  languageRow: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
    gap: 4, paddingHorizontal: layout.screenPaddingH, paddingTop: spacing.sm,
  },
  langChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  langChipActive: { backgroundColor: colors.accentPrimaryLight + '30' },
  langText: {
    fontFamily: fontFamily.sans, fontSize: 11,
    color: colors.textTertiary,
  },
  langTextActive: { color: colors.accentPrimary, fontWeight: '600' },

  // Logo
  logoSection: { alignItems: 'center', paddingTop: 60 },
  appIcon: { width: 80, height: 80, resizeMode: 'contain' },
  appName: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 28, fontWeight: '400',
    color: colors.textPrimary, marginTop: spacing.lg,
  },
  welcomeText: {
    fontFamily: fontFamily.sans,
    fontSize: 14, color: colors.textSecondary,
    marginTop: spacing.sm, textAlign: 'center',
  },

  // Form
  formSection: { paddingHorizontal: layout.screenPaddingH },
  showPwText: {
    fontFamily: fontFamily.sans, fontSize: 11, color: colors.textTertiary,
  },
  forgotBtn: { alignItems: 'center', marginTop: spacing.lg },
  forgotText: {
    fontFamily: fontFamily.sans, fontSize: 13, color: colors.textTertiary,
  },

  // Footer
  footer: { alignItems: 'center', paddingHorizontal: spacing['2xl'], paddingBottom: spacing['3xl'] },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.accentSand + '40' },
  dividerText: {
    fontFamily: fontFamily.sans, fontSize: 11,
    color: colors.textTertiary, marginHorizontal: spacing.md,
  },

  socialBtns: { width: '100%', marginTop: spacing.xl, gap: spacing.sm },
  socialBtn: {
    height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bgIvory, borderWidth: 1, borderColor: colors.accentSand + '40',
    borderRadius: borderRadius.lg, gap: 8,
  },
  socialBtnText: {
    fontFamily: fontFamily.sansMedium, fontSize: 15, color: colors.textPrimary,
  },
  socialBtnDark: {
    height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.lg, gap: 8,
  },
  socialBtnDarkText: {
    fontFamily: fontFamily.sansMedium, fontSize: 15, color: colors.surfacePure,
  },

  signupRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl },
  signupHint: { fontFamily: fontFamily.sans, fontSize: 14, color: colors.textSecondary },
  signupLink: { fontFamily: fontFamily.sansMedium, fontSize: 14, color: colors.accentPrimary },

  legalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  legalText: { fontFamily: fontFamily.sans, fontSize: 11, color: colors.textTertiary },
});
