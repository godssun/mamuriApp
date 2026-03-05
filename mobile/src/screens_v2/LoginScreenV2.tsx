/**
 * LoginScreen v2 — Premium AI Companion Style
 *
 * Design: Minimal, warm, trust-building
 * - Centered layout with generous whitespace
 * - Indigo primary gradient feel
 * - Soft elevation on input cards
 * - Animated entrance
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';
import { changeLanguage, SupportedLanguage } from '../i18n/i18n';
import { useThemeV2 } from '../design-system-v2';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { AuthStackParamList } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'EN' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
];

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreenV2({ navigation }: Props) {
  const { theme } = useThemeV2();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Entrance animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.spring(logoAnim, {
        toValue: 1,
        ...theme.springs.gentle,
        useNativeDriver: true,
      }),
      Animated.spring(formAnim, {
        toValue: 1,
        ...theme.springs.gentle,
        useNativeDriver: true,
      }),
      Animated.spring(footerAnim, {
        toValue: 1,
        ...theme.springs.soft,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.alert'), t('common.fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      // 성공 시 RootStack의 isAuthenticated 체크가 자동으로 Main으로 이동
    } catch (error: any) {
      Alert.alert(t('auth.loginFailed'), error?.message || t('auth.loginFailedMessage'));
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
      {/* Language Selector */}
      <View style={[styles.languageRow, { paddingHorizontal: theme.layout.screenPaddingH, paddingTop: theme.spacing.sm }]}>
        {LANGUAGES.map((lang) => {
          const isActive = i18n.language === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageChip,
                {
                  backgroundColor: isActive ? theme.colors.primarySubtle : 'transparent',
                  borderRadius: theme.borderRadius.full,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.xxs,
                },
              ]}
              onPress={() => changeLanguage(lang.code)}
            >
              <Text style={[
                theme.typography.caption,
                {
                  color: isActive ? theme.colors.primary : theme.colors.textTertiary,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Logo & Welcome */}
      <Animated.View style={[
        styles.logoSection,
        {
          opacity: logoAnim,
          transform: [{
            translateY: logoAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        },
      ]}>
        {/* App icon / companion avatar */}
        <View style={[styles.logoCircle, {
          backgroundColor: theme.colors.primarySubtle,
          borderColor: theme.colors.primaryLight,
        }]}>
          <Text style={styles.logoEmoji}>🌿</Text>
        </View>

        <Text style={[
          theme.typography.displayMedium,
          { color: theme.colors.textPrimary, marginTop: theme.spacing.lg },
        ]}>
          {t('auth.appName')}
        </Text>

        <Text style={[
          theme.typography.bodyMedium,
          {
            color: theme.colors.textSecondary,
            marginTop: theme.spacing.sm,
            textAlign: 'center',
          },
        ]}>
          {t('auth.welcome')}
        </Text>
      </Animated.View>

      {/* Form */}
      <Animated.View style={[
        styles.formSection,
        {
          paddingHorizontal: theme.layout.screenPaddingH,
          opacity: formAnim,
          transform: [{
            translateY: formAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          }],
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
          containerStyle={{ marginBottom: theme.spacing.lg }}
        />

        <Input
          label={t('auth.password')}
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          rightIcon={
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={[
                theme.typography.labelSmall,
                { color: theme.colors.textTertiary },
              ]}>
                {showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              </Text>
            </TouchableOpacity>
          }
          containerStyle={{ marginBottom: theme.spacing['2xl'] }}
        />

        <Button
          label={t('auth.login')}
          onPress={handleLogin}
          loading={loading}
          fullWidth
          size="lg"
        />

        <TouchableOpacity style={[styles.forgotButton, { marginTop: theme.spacing.lg }]}>
          <Text style={[
            theme.typography.bodySmall,
            { color: theme.colors.textTertiary },
          ]}>
            {t('auth.forgotPassword')}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Footer */}
      <Animated.View style={[
        styles.footer,
        {
          paddingBottom: theme.spacing['3xl'],
          opacity: footerAnim,
        },
      ]}>
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          <Text style={[
            theme.typography.caption,
            { color: theme.colors.textTertiary, marginHorizontal: theme.spacing.md },
          ]}>
            {t('auth.or')}
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        </View>

        <TouchableOpacity
          style={[styles.signupRow, { marginTop: theme.spacing.xl }]}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.textSecondary }]}>
            {t('auth.noAccount')}{' '}
          </Text>
          <Text style={[theme.typography.labelLarge, { color: theme.colors.primary }]}>
            {t('auth.signup')}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  languageChip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 60,
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
  formSection: {
    width: '100%',
  },
  forgotButton: {
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
