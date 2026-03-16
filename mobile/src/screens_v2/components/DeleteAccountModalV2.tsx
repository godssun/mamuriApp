/**
 * Design System v2 — Delete Account Modal
 *
 * 3-step flow: warning → reason → password confirmation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeV2 } from '../../design-system-v2';
import { accountApi, ApiError } from '../../api/client';
import { Button } from './Button';
import { Input } from './Input';

const DELETION_REASONS = [
  { key: 'lowUsage', i18nKey: 'deleteAccount.reasonLowUsage' },
  { key: 'otherApp', i18nKey: 'deleteAccount.reasonOtherApp' },
  { key: 'privacy', i18nKey: 'deleteAccount.reasonPrivacy' },
  { key: 'ai', i18nKey: 'deleteAccount.reasonAI' },
  { key: 'ux', i18nKey: 'deleteAccount.reasonUX' },
  { key: 'other', i18nKey: 'deleteAccount.reasonOther' },
] as const;

interface Props {
  visible: boolean;
  onClose: () => void;
  onDeleted: () => void;
  isPremium: boolean;
}

export function DeleteAccountModalV2({ visible, onClose, onDeleted, isPremium }: Props) {
  const { t } = useTranslation();
  const { theme } = useThemeV2();
  const [step, setStep] = useState(1);
  const [selectedReasonKey, setSelectedReasonKey] = useState<string | null>(null);
  const [reasonDetail, setReasonDetail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const resetState = () => {
    setStep(1);
    setSelectedReasonKey(null);
    setReasonDetail('');
    setPassword('');
    setError(null);
    setIsDeleting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleNext = () => {
    setError(null);
    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) {
      setStep(step - 1);
    } else {
      handleClose();
    }
  };

  const handleDelete = async () => {
    if (!password.trim()) {
      setError(t('deleteAccount.passwordRequired'));
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const selectedReason = DELETION_REASONS.find(r => r.key === selectedReasonKey);
      const reasonText = selectedReason ? t(selectedReason.i18nKey) : t('deleteAccount.reasonOther');
      await accountApi.deleteAccount({
        password: password.trim(),
        reason: reasonText,
        reasonDetail: selectedReasonKey === 'other' ? reasonDetail.trim() || undefined : undefined,
      });
      resetState();
      onDeleted();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t('deleteAccount.deleteFailed'));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const canProceedStep2 = selectedReasonKey !== null &&
    (selectedReasonKey !== 'other' || reasonDetail.trim().length > 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modal, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius['2xl'] }]}>
          {/* Step 1: 경고 */}
          {step === 1 && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[theme.typography.headlineSmall, { color: theme.colors.textPrimary, textAlign: 'center', marginBottom: theme.spacing.sm }]}>
                {t('deleteAccount.confirmTitle')}
              </Text>

              <View style={[styles.warningBox, { backgroundColor: theme.colors.warningSubtle, borderRadius: theme.borderRadius.md }]}>
                <Text style={[theme.typography.titleSmall, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>
                  {t('deleteAccount.dataDeleted')}
                </Text>
                <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, lineHeight: 22 }]}>
                  {t('deleteAccount.dataList')}
                </Text>
              </View>

              <View style={[styles.dangerBox, { backgroundColor: theme.colors.errorSubtle, borderRadius: theme.borderRadius.md }]}>
                <Text style={[theme.typography.bodySmall, { color: theme.colors.error, lineHeight: 20, textAlign: 'center' }]}>
                  {t('deleteAccount.irreversible')}
                </Text>
              </View>

              {isPremium && (
                <View style={[styles.premiumWarningBox, { backgroundColor: theme.colors.warningSubtle, borderRadius: theme.borderRadius.md }]}>
                  <Text style={[theme.typography.bodySmall, { color: theme.colors.warning, lineHeight: 20, textAlign: 'center' }]}>
                    {t('deleteAccount.premiumWarning')}
                  </Text>
                </View>
              )}

              <View style={[styles.buttonRow, { marginTop: theme.spacing.lg }]}>
                <View style={styles.buttonFlex}>
                  <Button label={t('common.cancel')} variant="secondary" onPress={handleClose} fullWidth />
                </View>
                <View style={styles.buttonFlex}>
                  <Button label={t('common.next')} variant="primary" onPress={handleNext} fullWidth />
                </View>
              </View>
            </ScrollView>
          )}

          {/* Step 2: 사유 선택 */}
          {step === 2 && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[theme.typography.headlineSmall, { color: theme.colors.textPrimary, textAlign: 'center', marginBottom: theme.spacing.xs }]}>
                {t('deleteAccount.reasonTitle')}
              </Text>
              <Text style={[theme.typography.bodySmall, { color: theme.colors.textTertiary, textAlign: 'center', marginBottom: theme.spacing.xl }]}>
                {t('deleteAccount.reasonSubtitle')}
              </Text>

              <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
                {DELETION_REASONS.map((reason) => {
                  const isSelected = selectedReasonKey === reason.key;
                  return (
                    <TouchableOpacity
                      key={reason.key}
                      style={[
                        styles.reasonItem,
                        {
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                          backgroundColor: isSelected ? theme.colors.primarySubtle : theme.colors.surface,
                          borderRadius: theme.borderRadius.md,
                        },
                      ]}
                      onPress={() => setSelectedReasonKey(reason.key)}
                    >
                      <View style={[
                        styles.radioCircle,
                        { borderColor: isSelected ? theme.colors.primary : theme.colors.textDisabled },
                      ]}>
                        {isSelected && <View style={[styles.radioDot, { backgroundColor: theme.colors.primary }]} />}
                      </View>
                      <Text style={[
                        theme.typography.bodyMedium,
                        { color: theme.colors.textPrimary, flex: 1 },
                        isSelected && { fontWeight: '500' },
                      ]}>
                        {t(reason.i18nKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedReasonKey === 'other' && (
                <Input
                  value={reasonDetail}
                  onChangeText={setReasonDetail}
                  placeholder={t('deleteAccount.reasonDetailPlaceholder')}
                  multiline
                  maxLength={500}
                  containerStyle={{ marginBottom: theme.spacing.lg }}
                />
              )}

              <View style={styles.buttonRow}>
                <View style={styles.buttonFlex}>
                  <Button label={t('deleteAccount.previous')} variant="secondary" onPress={handleBack} fullWidth />
                </View>
                <View style={styles.buttonFlex}>
                  <Button label={t('common.next')} variant="primary" onPress={handleNext} disabled={!canProceedStep2} fullWidth />
                </View>
              </View>
            </ScrollView>
          )}

          {/* Step 3: 비밀번호 확인 */}
          {step === 3 && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[theme.typography.headlineSmall, { color: theme.colors.textPrimary, textAlign: 'center', marginBottom: theme.spacing.xs }]}>
                {t('deleteAccount.passwordTitle')}
              </Text>
              <Text style={[theme.typography.bodySmall, { color: theme.colors.textTertiary, textAlign: 'center', marginBottom: theme.spacing.xl }]}>
                {t('deleteAccount.passwordSubtitle')}
              </Text>

              <Input
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(null);
                }}
                placeholder={t('auth.password')}
                secureTextEntry
                autoFocus
                error={error ?? undefined}
                containerStyle={{ marginBottom: theme.spacing.lg }}
              />

              <View style={styles.buttonRow}>
                <View style={styles.buttonFlex}>
                  <Button label={t('deleteAccount.previous')} variant="secondary" onPress={handleBack} fullWidth />
                </View>
                <View style={styles.buttonFlex}>
                  <Button label={t('deleteAccount.deleteButton')} variant="danger" onPress={handleDelete} loading={isDeleting} fullWidth />
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    padding: 24,
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
  },
  warningBox: {
    padding: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  dangerBox: {
    padding: 14,
    marginBottom: 12,
  },
  premiumWarningBox: {
    padding: 14,
    marginBottom: 12,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  buttonFlex: {
    flex: 1,
  },
});
