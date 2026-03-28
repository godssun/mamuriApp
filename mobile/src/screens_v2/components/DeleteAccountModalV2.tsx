/**
 * DeleteAccountModal v3 — Careful paper dialog for account deletion
 *
 * 3-step flow: warning → reason → confirmation
 * Ivory paper surface, clear destructive action hierarchy.
 * Serious and readable, but still part of the warm app world.
 *
 * v3 design system tokens.
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  colors, fontFamily, shadows, spacing, borderRadius,
} from '../../design-system-v3';
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
  isSocialUser: boolean;
}

export function DeleteAccountModalV2({ visible, onClose, onDeleted, isPremium, isSocialUser }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [selectedReasonKey, setSelectedReasonKey] = useState<string | null>(null);
  const [reasonDetail, setReasonDetail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const resetState = () => {
    setStep(1); setSelectedReasonKey(null); setReasonDetail('');
    setPassword(''); setConfirmText(''); setError(null); setIsDeleting(false);
  };

  const handleClose = () => { resetState(); onClose(); };
  const handleNext = () => { setError(null); setStep(step + 1); };
  const handleBack = () => { setError(null); step > 1 ? setStep(step - 1) : handleClose(); };

  const handleDelete = async () => {
    if (isSocialUser) {
      if (confirmText.trim() !== t('deleteAccount.socialConfirmWord')) {
        setError(t('deleteAccount.socialConfirmMismatch')); return;
      }
    } else {
      if (!password.trim()) { setError(t('deleteAccount.passwordRequired')); return; }
    }
    setIsDeleting(true); setError(null);
    try {
      const selectedReason = DELETION_REASONS.find(r => r.key === selectedReasonKey);
      await accountApi.deleteAccount({
        password: isSocialUser ? undefined : password.trim(),
        reason: selectedReason ? t(selectedReason.i18nKey) : t('deleteAccount.reasonOther'),
        reasonDetail: selectedReasonKey === 'other' ? reasonDetail.trim() || undefined : undefined,
      });
      resetState(); onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('deleteAccount.deleteFailed'));
    } finally { setIsDeleting(false); }
  };

  const canProceedStep2 = selectedReasonKey !== null &&
    (selectedReasonKey !== 'other' || reasonDetail.trim().length > 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.modal}>
          {/* Step 1: Warning */}
          {step === 1 && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.stepTitle}>{t('deleteAccount.confirmTitle')}</Text>

              <View style={s.warningBox}>
                <Text style={s.warningTitle}>{t('deleteAccount.dataDeleted')}</Text>
                <Text style={s.warningBody}>{t('deleteAccount.dataList')}</Text>
              </View>

              <View style={s.dangerBox}>
                <Text style={s.dangerText}>{t('deleteAccount.irreversible')}</Text>
              </View>

              {isPremium && (
                <View style={s.premiumBox}>
                  <Text style={s.premiumText}>{t('deleteAccount.premiumWarning')}</Text>
                </View>
              )}

              <View style={s.buttonRow}>
                <View style={s.buttonFlex}>
                  <Button label={t('common.cancel')} variant="secondary" onPress={handleClose} fullWidth />
                </View>
                <View style={s.buttonFlex}>
                  <Button label={t('common.next')} variant="primary" onPress={handleNext} fullWidth />
                </View>
              </View>
            </ScrollView>
          )}

          {/* Step 2: Reason */}
          {step === 2 && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.stepTitle}>{t('deleteAccount.reasonTitle')}</Text>
              <Text style={s.stepSubtitle}>{t('deleteAccount.reasonSubtitle')}</Text>

              <View style={s.reasonList}>
                {DELETION_REASONS.map((reason) => {
                  const sel = selectedReasonKey === reason.key;
                  return (
                    <TouchableOpacity
                      key={reason.key}
                      style={[s.reasonItem, sel ? s.reasonSelected : s.reasonDefault]}
                      onPress={() => setSelectedReasonKey(reason.key)}
                    >
                      <View style={[s.radioCircle, { borderColor: sel ? colors.accentPrimary : colors.textTertiary }]}>
                        {sel && <View style={s.radioDot} />}
                      </View>
                      <Text style={[s.reasonText, sel && { fontWeight: '500' }]}>{t(reason.i18nKey)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedReasonKey === 'other' && (
                <Input value={reasonDetail} onChangeText={setReasonDetail}
                  placeholder={t('deleteAccount.reasonDetailPlaceholder')} multiline maxLength={500}
                  containerStyle={{ marginBottom: spacing.lg }} />
              )}

              <View style={s.buttonRow}>
                <View style={s.buttonFlex}><Button label={t('deleteAccount.previous')} variant="secondary" onPress={handleBack} fullWidth /></View>
                <View style={s.buttonFlex}><Button label={t('common.next')} variant="primary" onPress={handleNext} disabled={!canProceedStep2} fullWidth /></View>
              </View>
            </ScrollView>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.stepTitle}>
                {isSocialUser ? t('deleteAccount.socialConfirmTitle') : t('deleteAccount.passwordTitle')}
              </Text>
              <Text style={s.stepSubtitle}>
                {isSocialUser ? t('deleteAccount.socialConfirmSubtitle') : t('deleteAccount.passwordSubtitle')}
              </Text>

              {isSocialUser ? (
                <Input value={confirmText} onChangeText={(v) => { setConfirmText(v); setError(null); }}
                  placeholder={t('deleteAccount.socialConfirmPlaceholder')} autoFocus
                  error={error ?? undefined} containerStyle={{ marginBottom: spacing.lg }} />
              ) : (
                <Input value={password} onChangeText={(v) => { setPassword(v); setError(null); }}
                  placeholder={t('auth.password')} secureTextEntry autoFocus
                  error={error ?? undefined} containerStyle={{ marginBottom: spacing.lg }} />
              )}

              <View style={s.buttonRow}>
                <View style={s.buttonFlex}><Button label={t('deleteAccount.previous')} variant="secondary" onPress={handleBack} fullWidth /></View>
                <View style={s.buttonFlex}><Button label={t('deleteAccount.deleteButton')} variant="danger" onPress={handleDelete} loading={isDeleting} fullWidth /></View>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.overlayDim, padding: spacing['2xl'] },
  modal: {
    padding: spacing['2xl'], width: '100%', maxWidth: 360, maxHeight: '80%',
    backgroundColor: colors.bgIvory, borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', ...shadows.soft,
  },

  stepTitle: { fontFamily: fontFamily.serifItalic, fontSize: 20, fontWeight: '400', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
  stepSubtitle: { fontFamily: fontFamily.sans, fontSize: 13, color: colors.textTertiary, textAlign: 'center', marginBottom: spacing.xl },

  warningBox: { padding: spacing.lg, backgroundColor: colors.accentMustard + '12', borderRadius: borderRadius.sm, marginTop: spacing.lg, marginBottom: spacing.md },
  warningTitle: { fontFamily: fontFamily.sansMedium, fontSize: 14, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.sm },
  warningBody: { fontFamily: fontFamily.sans, fontSize: 13, lineHeight: 22, color: colors.textSecondary },

  dangerBox: { padding: 14, backgroundColor: '#F8E8E8', borderRadius: borderRadius.sm, marginBottom: spacing.md },
  dangerText: { fontFamily: fontFamily.sans, fontSize: 13, lineHeight: 20, color: '#D04444', textAlign: 'center' },

  premiumBox: { padding: 14, backgroundColor: colors.accentMustard + '12', borderRadius: borderRadius.sm, marginBottom: spacing.md },
  premiumText: { fontFamily: fontFamily.sans, fontSize: 13, lineHeight: 20, color: colors.accentMustard, textAlign: 'center' },

  reasonList: { gap: spacing.sm, marginBottom: spacing.lg },
  reasonItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, borderRadius: borderRadius.sm, gap: spacing.md },
  reasonDefault: { borderColor: colors.accentSand + '40', backgroundColor: colors.surfaceCard },
  reasonSelected: { borderColor: colors.accentPrimary, backgroundColor: colors.accentPrimaryLight + '15' },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentPrimary },
  reasonText: { fontFamily: fontFamily.sans, fontSize: 14, color: colors.textPrimary, flex: 1 },

  buttonRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  buttonFlex: { flex: 1 },
});
