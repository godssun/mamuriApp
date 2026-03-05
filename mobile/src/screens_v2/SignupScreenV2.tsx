/**
 * SignupScreen v2 — Premium AI Companion Style
 *
 * Design: Step-through feel, welcoming, minimal
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useThemeV2 } from '../design-system-v2';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { AuthStackParamList } from '../types';
import i18n from '../i18n/i18n';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export function SignupScreenV2({ navigation }: Props) {
  const { theme } = useThemeV2();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { signup } = useAuth();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Entrance
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(contentAnim, {
      toValue: 1,
      ...theme.springs.gentle,
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
    <View style={[styles.container, {
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
    }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: theme.layout.screenPaddingH }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { borderRadius: theme.borderRadius.sm }]}
        >
          <Text style={[theme.typography.titleLarge, { color: theme.colors.textPrimary }]}>
            ←
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.screenPaddingH,
          paddingBottom: insets.bottom + theme.spacing['4xl'],
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
          <Text style={[
            theme.typography.displayMedium,
            { color: theme.colors.textPrimary, marginTop: theme.spacing.lg },
          ]}>
            {t('auth.signupWelcome')}
          </Text>
          <Text style={[
            theme.typography.bodyLarge,
            {
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.sm,
              marginBottom: theme.spacing['3xl'],
            },
          ]}>
            {t('auth.signupSubtitle')}
          </Text>

          {/* Form */}
          <Input
            label={t('auth.nickname')}
            placeholder={t('auth.nicknamePlaceholder')}
            value={nickname}
            onChangeText={setNickname}
            autoCapitalize="none"
            containerStyle={{ marginBottom: theme.spacing.xl }}
          />

          <Input
            label={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={{ marginBottom: theme.spacing.xl }}
          />

          <Input
            label={t('auth.password')}
            placeholder={t('auth.passwordMinLength')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            containerStyle={{ marginBottom: theme.spacing.sm }}
          />

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <View style={[styles.strengthRow, { marginBottom: theme.spacing.xl }]}>
              <View style={styles.strengthBars}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor: i < passwordStrength.level
                          ? passwordStrength.color
                          : theme.colors.surfaceTertiary,
                        borderRadius: theme.borderRadius.xs,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[
                theme.typography.caption,
                { color: passwordStrength.color, marginLeft: theme.spacing.sm },
              ]}>
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
            containerStyle={{ marginBottom: theme.spacing['3xl'] }}
          />

          <Button
            label={t('auth.start')}
            onPress={handleSignup}
            loading={loading}
            fullWidth
            size="lg"
            disabled={!nickname || !email || !password || !!passwordError}
          />

          {/* Terms */}
          <Text style={[
            theme.typography.caption,
            {
              color: theme.colors.textTertiary,
              textAlign: 'center',
              marginTop: theme.spacing.xl,
              lineHeight: 18,
            },
          ]}>
            {t('auth.termsPrefix')}
            <Text style={{ color: theme.colors.primary }}>{t('auth.termsOfService')}</Text>
            {t('auth.termsAnd')}
            <Text style={{ color: theme.colors.primary }}>{t('auth.privacyPolicy')}</Text>
            {t('auth.termsSuffix')}
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
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
});
