/**
 * AiConsentModal — AI Data Processing Consent
 *
 * Modal for obtaining explicit user consent before sending
 * diary content to an external AI service (LLM API).
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeV2 } from '../../design-system-v2';

interface AiConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function AiConsentModal({ visible, onAccept, onDecline }: AiConsentModalProps) {
  const { theme } = useThemeV2();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDecline}>
      <TouchableOpacity
        style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}
        activeOpacity={1}
        onPress={onDecline}
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
            marginBottom: theme.spacing.md,
          }]}>
            {t('consent.title')}
          </Text>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            <Text style={[theme.typography.bodyMedium, {
              color: theme.colors.textSecondary,
              lineHeight: 22,
            }]}>
              {t('consent.body')}
            </Text>
          </ScrollView>

          <TouchableOpacity
            style={{ marginTop: theme.spacing.md }}
            onPress={() => {
              // TODO: 개인정보 처리방침 링크 열기
            }}
          >
            <Text style={[theme.typography.labelSmall, {
              color: theme.colors.primary,
              textAlign: 'center',
              textDecorationLine: 'underline',
            }]}>
              {t('consent.privacyLink')}
            </Text>
          </TouchableOpacity>

          <View style={[styles.actions, { marginTop: theme.spacing.xl, gap: theme.spacing.sm }]}>
            <TouchableOpacity
              style={[styles.actionButton, {
                backgroundColor: theme.colors.surfaceSecondary,
                borderRadius: theme.borderRadius.md,
              }]}
              onPress={onDecline}
            >
              <Text style={[theme.typography.labelLarge, { color: theme.colors.textSecondary }]}>
                {t('consent.decline')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.md,
              }]}
              onPress={onAccept}
            >
              <Text style={[theme.typography.labelLarge, { color: '#FFFFFF' }]}>
                {t('consent.accept')}
              </Text>
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
    maxHeight: '80%',
  },
  bodyScroll: {
    maxHeight: 200,
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
