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
import { useTheme } from '../contexts/ThemeContext';
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
      '더 깊이 있는 AI 대화',
      '월간 감정 리포트 (예정)',
    ],
  },
];

export default function PaywallScreen({ navigation }: Props) {
  const { hasCrisisFlag } = useSubscription();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
          <Text style={styles.heroTitle}>
            오늘의 대화 횟수를{'\n'}모두 사용했어요
          </Text>
          <Text style={styles.heroSubtitle}>
            구독하면 더 많은 AI 대화를 나눌 수 있어요
          </Text>
        </View>

        <TouchableOpacity
          style={styles.trialBanner}
          onPress={() => navigation.replace('Subscription')}
        >
          <Text style={styles.trialBadge}>추천</Text>
          <Text style={styles.trialTitle}>7일 무료 체험 시작하기</Text>
          <Text style={styles.trialSubtitle}>
            체험 기간 동안 하루 3회 AI 답변을 받을 수 있어요
          </Text>
          <Text style={styles.trialNote}>
            체험 종료 후 자동 결제 · 언제든 취소 가능
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는 바로 구독</Text>
          <View style={styles.dividerLine} />
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
  trialBanner: {
    backgroundColor: '#FFF0EB',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#FF9B7A',
    alignItems: 'center',
  },
  trialBadge: {
    backgroundColor: '#FF9B7A',
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  trialTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FF9B7A',
    marginBottom: 6,
  },
  trialSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  trialNote: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  dividerText: {
    fontSize: 12,
    color: '#999',
    paddingHorizontal: 12,
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
