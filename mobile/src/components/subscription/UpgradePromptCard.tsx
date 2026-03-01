import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  onUpgrade: () => void;
}

export default function UpgradePromptCard({ onUpgrade }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        답변 횟수를 모두 사용했어요
      </Text>
      <Text style={styles.subText}>
        업그레이드하면 더 많은 대화를 나눌 수 있어요
      </Text>
      <TouchableOpacity style={styles.button} onPress={onUpgrade}>
        <Text style={styles.buttonText}>요금제 알아보기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF9F5',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE8DE',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  subText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FF9B7A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
