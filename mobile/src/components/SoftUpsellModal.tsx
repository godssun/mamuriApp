import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';

interface Props {
  visible: boolean;
  aiName: string;
  onLearnMore: () => void;
  onDismiss: () => void;
}

export default function SoftUpsellModal({ visible, aiName, onLearnMore, onDismiss }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.emoji}>🌟</Text>

          <Text style={styles.title}>
            {aiName}이(가) 많이 성장했어요!
          </Text>

          <Text style={styles.description}>
            프리미엄으로 업그레이드하면{'\n'}
            {aiName}이(가) 더 깊이 있는 코멘트를 남겨줄 수 있어요.
          </Text>

          <View style={styles.benefits}>
            <Text style={styles.benefitItem}>무제한 AI 코멘트</Text>
            <Text style={styles.benefitItem}>더 풍부한 감정 분석</Text>
            <Text style={styles.benefitItem}>성장 리포트 (예정)</Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={onLearnMore}>
            <Text style={styles.primaryButtonText}>더 알아보기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>나중에</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  benefits: {
    alignSelf: 'stretch',
    backgroundColor: '#FFF9F5',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 24,
  },
  benefitItem: {
    fontSize: 14,
    color: '#2D2D2D',
    fontWeight: '500',
    paddingLeft: 8,
  },
  primaryButton: {
    backgroundColor: '#FF9B7A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    paddingVertical: 8,
  },
  dismissButtonText: {
    fontSize: 14,
    color: '#999',
  },
});
