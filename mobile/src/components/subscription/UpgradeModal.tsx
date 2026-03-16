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
  onUpgrade: () => void;
  onDismiss: () => void;
}

export default function UpgradeModal({ visible, aiName, onUpgrade, onDismiss }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            {aiName}와(과) 더 대화하고 싶으신가요?
          </Text>

          <Text style={styles.description}>
            업그레이드하면 더 많은 대화를 나눌 수 있어요
          </Text>

          <View style={styles.tiers}>
            <View style={styles.tierRow}>
              <Text style={styles.tierName}>무료</Text>
              <Text style={styles.tierLimit}>하루 1회 맛보기</Text>
            </View>
            <View style={styles.tierRow}>
              <Text style={styles.tierName}>디럭스</Text>
              <Text style={styles.tierLimit}>하루 3회 답변</Text>
            </View>
            <View style={[styles.tierRow, styles.tierRowHighlight]}>
              <Text style={[styles.tierName, styles.tierNameHighlight]}>프리미엄</Text>
              <Text style={[styles.tierLimit, styles.tierLimitHighlight]}>무제한 답변</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={onUpgrade}>
            <Text style={styles.primaryButtonText}>요금제 보기</Text>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  tiers: {
    alignSelf: 'stretch',
    gap: 8,
    marginBottom: 24,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tierRowHighlight: {
    backgroundColor: '#FFF0EB',
    borderWidth: 1,
    borderColor: '#FF9B7A',
  },
  tierName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  tierNameHighlight: {
    color: '#FF9B7A',
  },
  tierLimit: {
    fontSize: 13,
    color: '#999',
  },
  tierLimitHighlight: {
    color: '#FF9B7A',
    fontWeight: '500',
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
