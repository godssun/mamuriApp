/**
 * AdBanner — Google AdMob adaptive banner
 *
 * - Premium 구독자에게는 광고를 표시하지 않음
 * - __DEV__ 환경에서는 Google 테스트 배너 ID 사용
 * - 프로덕션에서만 실제 Ad Unit ID 사용
 */

import React, { useState } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useSubscription } from '../contexts/SubscriptionContext';

const BANNER_AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-1553144894464526/2429998078',
  android: 'ca-app-pub-1553144894464526/2220116646',
}) ?? '';

export function AdBanner() {
  const { isPremium } = useSubscription();
  const [adLoaded, setAdLoaded] = useState(false);

  if (isPremium) return null;

  return (
    <View style={[styles.container, !adLoaded && styles.hidden]}>
      <BannerAd
        unitId={__DEV__ ? TestIds.ADAPTIVE_BANNER : BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => setAdLoaded(true)}
        onAdFailedToLoad={() => setAdLoaded(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  hidden: {
    height: 0,
    overflow: 'hidden',
  },
});
