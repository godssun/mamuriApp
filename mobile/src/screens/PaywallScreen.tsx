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

const PLANS = [
  {
    tier: 'DELUXE',
    label: '디럭스',
    price: '월 4,900원',
    highlight: false,
    benefits: [
      '하루 3회 AI 답변',
      'AI 친구와 매일 대화',
    ],
  },
  {
    tier: 'PREMIUM',
    label: '프리미엄',
    price: '월 9,900원',
    highlight: true,
    benefits: [
      '무제한 AI 답변',
      'AI 친구의 레벨 제한 해제',
      '월간 감정 리포트 (예정)',
    ],
  },
];

export default function PaywallScreen({ navigation }: Props) {
  const { hasCrisisFlag } = useSubscription();

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
            오늘의 대화 횟수를{'\n'}모두 사용했어요
          </Text>
          <Text style={styles.heroSubtitle}>
            구독하면 더 많은 AI 대화를 나눌 수 있어요
          </Text>
        </View>

        <View style={styles.plansSection}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.tier}
              style={[styles.planCard, plan.highlight && styles.planCardHighlight]}
              onPress={() => navigation.replace('Subscription')}
            >
              <View style={styles.planHeader}>
                <Text style={[styles.planLabel, plan.highlight && styles.planLabelHighlight]}>
                  {plan.label}
                </Text>
                <Text style={[styles.planPrice, plan.highlight && styles.planPriceHighlight]}>
                  {plan.price}
                </Text>
              </View>
              {plan.benefits.map((benefit) => (
                <Text key={benefit} style={[styles.planBenefit, plan.highlight && styles.planBenefitHighlight]}>
                  {'  '}
                  {benefit}
                </Text>
              ))}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.replace('Subscription')}
        >
          <Text style={styles.ctaButtonText}>요금제 보기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.freeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.freeButtonText}>
            나중에
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          일기는 AI 답변 없이도 저장할 수 있어요
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
  plansSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  planCardHighlight: {
    backgroundColor: '#FFF0EB',
    borderColor: '#FF9B7A',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  planLabelHighlight: {
    color: '#FF9B7A',
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  planPriceHighlight: {
    color: '#FF9B7A',
  },
  planBenefit: {
    fontSize: 13,
    color: '#666',
    lineHeight: 22,
  },
  planBenefitHighlight: {
    color: '#CC6B50',
  },
  ctaButton: {
    backgroundColor: '#FF9B7A',
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
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
