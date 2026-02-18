import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  progress: number; // 0~1
}

export default function ProgressBar({ progress }: Props) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clampedProgress * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    backgroundColor: '#FFF0EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#FF9B7A',
    borderRadius: 5,
  },
});
