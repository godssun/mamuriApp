import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { getCompanionConfig } from '../../constants/companion';
import { LevelUpInfo } from '../../types';

interface Props {
  visible: boolean;
  levelUpInfo: LevelUpInfo;
  aiName: string;
  onClose: () => void;
}

export default function LevelUpModal({ visible, levelUpInfo, aiName, onClose }: Props) {
  const oldConfig = getCompanionConfig(levelUpInfo.oldLevel);
  const newConfig = getCompanionConfig(levelUpInfo.newLevel);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.celebration}>🎉 레벨 업!</Text>

          <View style={styles.emojiTransition}>
            <Text style={styles.oldEmoji}>{oldConfig.emoji}</Text>
            <Text style={styles.arrow}>→</Text>
            <Text style={styles.newEmoji}>{newConfig.emoji}</Text>
          </View>

          <Text style={styles.message}>
            {aiName}이(가) Lv.{levelUpInfo.newLevel} {newConfig.title}(으)로 성장했어요!
          </Text>
          <Text style={styles.description}>{newConfig.description}</Text>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>좋아요!</Text>
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
  celebration: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF9B7A',
    marginBottom: 24,
  },
  emojiTransition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  oldEmoji: {
    fontSize: 40,
    opacity: 0.5,
  },
  arrow: {
    fontSize: 24,
    color: '#CCC',
  },
  newEmoji: {
    fontSize: 56,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#FF9B7A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
