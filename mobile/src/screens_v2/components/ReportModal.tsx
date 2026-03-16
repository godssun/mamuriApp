/**
 * ReportModal — AI Response Report Flow
 *
 * Minimal modal for reporting inappropriate AI responses.
 * Flow: select reason → submit → confirmation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeV2 } from '../../design-system-v2';
import { reportApi } from '../../api/client';
import { ReportReason } from '../../types';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  messageId: number;
  diaryId: number;
}

const REPORT_REASONS: ReportReason[] = [
  'inappropriate',
  'inaccurate',
  'offensive',
  'other',
];

export function ReportModal({ visible, onClose, messageId, diaryId }: ReportModalProps) {
  const { theme } = useThemeV2();
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
    } catch {
      Alert.alert(t('common.error'), t('report.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity
        style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.sheet, {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.xl,
          }]}
        >
          <Text style={[theme.typography.titleLarge, {
            color: theme.colors.textPrimary,
            textAlign: 'center',
            marginBottom: theme.spacing.xs,
          }]}>
            {t('report.title')}
          </Text>

          <Text style={[theme.typography.bodySmall, {
            color: theme.colors.textTertiary,
            textAlign: 'center',
            marginBottom: theme.spacing.xl,
          }]}>
            {t('report.subtitle')}
          </Text>

          {REPORT_REASONS.map((reason) => {
            const isSelected = selected === reason;
            return (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonRow, {
                  backgroundColor: isSelected ? theme.colors.primarySubtle : theme.colors.surfaceSecondary,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  borderRadius: theme.borderRadius.md,
                  marginBottom: theme.spacing.sm,
                }]}
                onPress={() => setSelected(reason)}
              >
                <View style={[styles.radio, {
                  borderColor: isSelected ? theme.colors.primary : theme.colors.textTertiary,
                }]}>
                  {isSelected && (
                    <View style={[styles.radioDot, { backgroundColor: theme.colors.primary }]} />
                  )}
                </View>
                <Text style={[theme.typography.bodyMedium, {
                  color: theme.colors.textPrimary,
                  flex: 1,
                }]}>
                  {t(`report.reason_${reason}`)}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={[styles.actions, { marginTop: theme.spacing.lg, gap: theme.spacing.sm }]}>
            <TouchableOpacity
              style={[styles.actionButton, {
                backgroundColor: theme.colors.surfaceSecondary,
                borderRadius: theme.borderRadius.md,
              }]}
              onPress={handleClose}
            >
              <Text style={[theme.typography.labelLarge, { color: theme.colors.textSecondary }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, {
                backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceTertiary,
                borderRadius: theme.borderRadius.md,
              }]}
              onPress={handleSubmit}
              disabled={!selected || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[theme.typography.labelLarge, {
                  color: selected ? '#FFFFFF' : theme.colors.textDisabled,
                }]}>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    padding: 24,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
