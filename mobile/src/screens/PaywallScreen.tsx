import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types';
import { useSubscription } from '../contexts/SubscriptionContext';
import CrisisBanner from '../components/CrisisBanner';

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Paywall'>;
};

const BENEFITS = [
  { icon: '♾️', title: '무제한 AI 코멘트', description: '매일 마음 놓고 일기를 써요' },
  { icon: '🌱', title: '성장 제한 해제', description: 'AI 친구의 레벨 제한이 사라져요' },
  { icon: '📊', title: '성장 리포트', description: '월간 감정 변화를 확인해요 (예정)' },
];

export default function PaywallScreen({ navigation }: Props) {
  const { hasCrisisFlag, quotaRemaining } = useSubscription();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 뒤로</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {hasCrisisFlag && <CrisisBanner />}

        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>📝</Text>
          <Text style={styles.heroTitle}>
            이번 달 AI 코멘트를{'\n'}모두 사용했어요
          </Text>
          <Text style={styles.heroSubtitle}>
            프리미엄으로 업그레이드하면{'\n'}
            무제한으로 AI 코멘트를 받을 수 있어요
          </Text>
        </View>

        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>프리미엄 혜택</Text>
          {BENEFITS.map((benefit) => (
            <View key={benefit.title} style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>{benefit.icon}</Text>
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.premiumButton}
          onPress={() => navigation.replace('Subscription')}
        >
          <Text style={styles.premiumButtonText}>프리미엄 시작하기</Text>
          <Text style={styles.premiumPriceText}>월 4,900원</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.freeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.freeButtonText}>
            계속 무료로 사용하기
            {quotaRemaining > 0 && ` (${quotaRemaining}건 남음)`}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          일기는 AI 코멘트 없이도 저장할 수 있어요
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 8,
  },
  backButton: {
    fontSize: 16,
    color: '#FF9B7A',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  heroEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  benefitIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 13,
    color: '#999',
  },
  premiumButton: {
    backgroundColor: '#FF9B7A',
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  premiumPriceText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  freeButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  freeButtonText: {
    fontSize: 14,
    color: '#999',
  },
  disclaimer: {
    fontSize: 12,
    color: '#BBB',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
