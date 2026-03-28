/**
 * ReportModal v3 — Calm paper report dialog
 *
 * Ivory paper dialog with sage radio buttons.
 * Clear and safe for reporting, not cold system alert.
 *
 * v3 design system tokens.
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  colors, fontFamily, shadows, spacing, borderRadius,
} from '../../design-system-v3';
import { reportApi } from '../../api/client';
import { ReportReason } from '../../types';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  messageId: number;
  diaryId: number;
}

const REPORT_REASONS: ReportReason[] = ['inappropriate', 'inaccurate', 'offensive', 'other'];

export function ReportModal({ visible, onClose, messageId, diaryId }: ReportModalProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<ReportReason | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await reportApi.submit({ messageId, diaryId, reason: selected });
      onClose();
      setSelected(null);
      Alert.alert(t('report.thankYouTitle'), t('report.thankYouMessage'));
    } catch { Alert.alert(t('common.error'), t('report.submitFailed')); }
    finally { setSubmitting(false); }
  };

  const handleClose = () => { setSelected(null); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={s.sheet}>
          <Text style={s.title}>{t('report.title')}</Text>
          <Text style={s.subtitle}>{t('report.subtitle')}</Text>

          {REPORT_REASONS.map((reason) => {
            const sel = selected === reason;
            return (
              <TouchableOpacity
                key={reason}
                style={[s.reasonRow, sel ? s.reasonSelected : s.reasonDefault]}
                onPress={() => setSelected(reason)}
              >
                <View style={[s.radio, { borderColor: sel ? colors.accentPrimary : colors.textTertiary }]}>
                  {sel && <View style={s.radioDot} />}
                </View>
                <Text style={s.reasonText}>{t(`report.reason_${reason}`)}</Text>
              </TouchableOpacity>
            );
          })}

          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={handleClose}>
              <Text style={s.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.submitBtn, { backgroundColor: selected ? colors.accentPrimary : colors.accentSand + '40' }]}
              onPress={handleSubmit}
              disabled={!selected || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.surfacePure} />
              ) : (
                <Text style={[s.submitText, { color: selected ? colors.surfacePure : colors.textTertiary }]}>
                  {t('report.submit')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.overlayDim, padding: spacing['2xl'] },
  sheet: {
    width: '100%', maxWidth: 340, padding: spacing['2xl'],
    backgroundColor: colors.bgIvory, borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', ...shadows.soft,
  },
  title: { fontFamily: fontFamily.serifItalic, fontSize: 20, fontWeight: '400', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { fontFamily: fontFamily.sans, fontSize: 13, color: colors.textTertiary, textAlign: 'center', marginBottom: spacing.xl },

  reasonRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, borderRadius: borderRadius.sm, marginBottom: spacing.sm, gap: spacing.md },
  reasonDefault: { borderColor: colors.accentSand + '40', backgroundColor: colors.surfaceCard },
  reasonSelected: { borderColor: colors.accentPrimary, backgroundColor: colors.accentPrimaryLight + '15' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentPrimary },
  reasonText: { fontFamily: fontFamily.sans, fontSize: 14, color: colors.textPrimary, flex: 1 },

  actions: { flexDirection: 'row', marginTop: spacing.lg, gap: spacing.sm },
  cancelBtn: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceCard, borderRadius: borderRadius.sm },
  cancelText: { fontFamily: fontFamily.sansMedium, fontSize: 14, color: colors.textSecondary },
  submitBtn: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.sm },
  submitText: { fontFamily: fontFamily.sansMedium, fontSize: 14 },
});
