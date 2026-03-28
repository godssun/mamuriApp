/**
 * AiConsentModal v3 — Warm paper consent dialog
 *
 * Trustworthy, calm, readable consent surface.
 * Ivory paper with clear hierarchy and sage accent.
 *
 * v3 design system tokens.
 */

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  colors, fontFamily, shadows, spacing, borderRadius,
} from '../../design-system-v3';

interface AiConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function AiConsentModal({ visible, onAccept, onDecline }: AiConsentModalProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDecline}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onDecline}>
        <TouchableOpacity activeOpacity={1} style={s.sheet}>
          <Text style={s.title}>{t('consent.title')}</Text>

          <ScrollView style={s.bodyScroll} showsVerticalScrollIndicator={false}>
            <Text style={s.body}>{t('consent.body')}</Text>
          </ScrollView>

          <TouchableOpacity style={s.privacyLink} onPress={() => Linking.openURL('https://mamuri.app/privacy')}>
            <Text style={s.privacyText}>{t('consent.privacyLink')}</Text>
          </TouchableOpacity>

          <View style={s.actions}>
            <TouchableOpacity style={s.declineBtn} onPress={onDecline}>
              <Text style={s.declineText}>{t('consent.decline')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.acceptBtn} onPress={onAccept}>
              <Text style={s.acceptText}>{t('consent.accept')}</Text>
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
    width: '100%', maxWidth: 340, padding: spacing['2xl'], maxHeight: '80%',
    backgroundColor: colors.bgIvory, borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', ...shadows.soft,
  },
  title: { fontFamily: fontFamily.serifItalic, fontSize: 20, fontWeight: '400', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.md },
  bodyScroll: { maxHeight: 200 },
  body: { fontFamily: fontFamily.sans, fontSize: 14, lineHeight: 22, color: colors.textSecondary },
  privacyLink: { marginTop: spacing.md },
  privacyText: { fontFamily: fontFamily.sans, fontSize: 12, color: colors.accentPrimary, textAlign: 'center', textDecorationLine: 'underline' },

  actions: { flexDirection: 'row', marginTop: spacing.xl, gap: spacing.sm },
  declineBtn: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceCard, borderRadius: borderRadius.sm },
  declineText: { fontFamily: fontFamily.sansMedium, fontSize: 14, color: colors.textSecondary },
  acceptBtn: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentPrimary, borderRadius: borderRadius.sm },
  acceptText: { fontFamily: fontFamily.sansMedium, fontSize: 14, color: colors.surfacePure },
});
