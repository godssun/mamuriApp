import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types';
import { subscriptionApi, ApiError } from '../api/client';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTheme } from '../contexts/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Subscription'>;
};

type PlanTier = 'deluxe' | 'premium';
type PlanPeriod = 'monthly' | 'yearly';

interface Plan {
  tier: PlanTier;
  period: PlanPeriod;
  name: string;
  price: string;
  periodLabel: string;
  priceId: string;
  features: string[];
  badge?: string;
}

const PLANS: Plan[] = [
  {
    tier: 'deluxe',
    period: 'monthly',
    name: '디럭스',
    price: '4,900원',
    periodLabel: '/월',
    priceId: 'price_deluxe_monthly',
    features: ['하루 3회 대화', 'AI 친구 개인화', '스트릭 기능'],
  },
  {
    tier: 'deluxe',
    period: 'yearly',
    name: '디럭스 연간',
    price: '49,000원',
    periodLabel: '/년',
    priceId: 'price_deluxe_yearly',
    features: ['하루 3회 대화', 'AI 친구 개인화', '스트릭 기능'],
    badge: '17% 할인',
  },
  {
    tier: 'premium',
    period: 'monthly',
    name: '프리미엄',
    price: '9,900원',
    periodLabel: '/월',
    priceId: 'price_premium_monthly',
    features: ['무제한 대화', 'AI 친구 개인화', '스트릭 기능', '우선 응답'],
  },
  {
    tier: 'premium',
    period: 'yearly',
    name: '프리미엄 연간',
    price: '99,000원',
    periodLabel: '/년',
    priceId: 'price_premium_yearly',
    features: ['무제한 대화', 'AI 친구 개인화', '스트릭 기능', '우선 응답'],
    badge: '17% 할인',
  },
];

export default function SubscriptionScreen({ navigation }: Props) {
  const { info, isSubscribed, refresh } = useSubscription();
  const { theme } = useTheme();
  const [selectedTier, setSelectedTier] = useState<PlanTier>('deluxe');
  const [selectedPeriod, setSelectedPeriod] = useState<PlanPeriod>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const selectedPlan = PLANS.find(
    (p) => p.tier === selectedTier && p.period === selectedPeriod
  );

  const currentTier = info?.tier ?? 'FREE';

  const handleCheckout = async () => {
    if (!selectedPlan) return;

    setIsLoading(true);
    try {
      const { checkoutUrl } = await subscriptionApi.createCheckout(selectedPlan.priceId);
      await Linking.openURL(checkoutUrl);
      setTimeout(() => refresh(), 3000);
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : '결제 페이지를 열 수 없습니다.';
      Alert.alert('오류', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      '구독 취소',
      '정말 구독을 취소하시겠어요?\n현재 결제 기간이 끝나면 무료 플랜으로 전환됩니다.',
      [
        { text: '유지하기', style: 'cancel' },
        {
          text: '취소하기',
          style: 'destructive',
          onPress: async () => {
            setIsCanceling(true);
            try {
              await subscriptionApi.cancel();
              await refresh();
              Alert.alert('완료', '구독이 취소되었습니다.');
            } catch (error) {
              const message = error instanceof ApiError
                ? error.message
                : '구독 취소에 실패했습니다.';
              Alert.alert('오류', message);
            } finally {
              setIsCanceling(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'DELUXE': return '디럭스';
      case 'PREMIUM': return '프리미엄';
      default: return '무료';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>구독 관리</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* 현재 상태 */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>현재 플랜</Text>
            <View style={[styles.statusBadge, isSubscribed && styles.statusBadgePremium]}>
              <Text style={[styles.statusBadgeText, isSubscribed && styles.statusBadgeTextPremium]}>
                {getTierLabel(currentTier)}
              </Text>
            </View>
          </View>

          {info?.trialActive && (
            <Text style={styles.trialText}>
              체험 기간: {formatDate(info.trialEnd)}까지
            </Text>
          )}

          {isSubscribed && info?.currentPeriodEnd && !info.trialActive && (
            <Text style={styles.periodText}>
              다음 결제일: {formatDate(info.currentPeriodEnd)}
            </Text>
          )}
        </View>

        {/* 플랜 선택 (미구독자만) */}
        {!isSubscribed && (
          <>
            {/* 티어 선택 */}
            <Text style={styles.sectionTitle}>플랜 선택</Text>
            <View style={styles.tierSelector}>
              <TouchableOpacity
                style={[styles.tierTab, selectedTier === 'deluxe' && styles.tierTabSelected]}
                onPress={() => setSelectedTier('deluxe')}
              >
                <Text style={[styles.tierTabText, selectedTier === 'deluxe' && styles.tierTabTextSelected]}>
                  디럭스
                </Text>
                <Text style={[styles.tierTabPrice, selectedTier === 'deluxe' && styles.tierTabPriceSelected]}>
                  월 4,900원
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tierTab, selectedTier === 'premium' && styles.tierTabSelected]}
                onPress={() => setSelectedTier('premium')}
              >
                <Text style={[styles.tierTabText, selectedTier === 'premium' && styles.tierTabTextSelected]}>
                  프리미엄
                </Text>
                <Text style={[styles.tierTabPrice, selectedTier === 'premium' && styles.tierTabPriceSelected]}>
                  월 9,900원
                </Text>
              </TouchableOpacity>
            </View>

            {/* 기간 선택 */}
            <View style={styles.periodSelector}>
              <TouchableOpacity
                style={[styles.periodTab, selectedPeriod === 'monthly' && styles.periodTabSelected]}
                onPress={() => setSelectedPeriod('monthly')}
              >
                <Text style={[styles.periodTabText, selectedPeriod === 'monthly' && styles.periodTabTextSelected]}>
                  월간
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodTab, selectedPeriod === 'yearly' && styles.periodTabSelected]}
                onPress={() => setSelectedPeriod('yearly')}
              >
                <Text style={[styles.periodTabText, selectedPeriod === 'yearly' && styles.periodTabTextSelected]}>
                  연간 (17% 할인)
                </Text>
              </TouchableOpacity>
            </View>

            {/* 선택된 플랜 상세 */}
            {selectedPlan && (
              <View style={styles.planDetail}>
                <Text style={styles.planDetailName}>{selectedPlan.name}</Text>
                <Text style={styles.planDetailPrice}>
                  {selectedPlan.price}{selectedPlan.periodLabel}
                </Text>
                <View style={styles.featureList}>
                  {selectedPlan.features.map((feature, i) => (
                    <Text key={i} style={styles.featureItem}>
                      ✓ {feature}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            <Text style={styles.trialInfo}>
              첫 구독 시 7일간 무료로 체험할 수 있어요
            </Text>

            <TouchableOpacity
              style={[styles.checkoutButton, isLoading && styles.checkoutButtonDisabled]}
              onPress={handleCheckout}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.checkoutButtonText}>구독 시작하기</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* 구독 취소 (구독자만) */}
        {isSubscribed && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isCanceling}
          >
            {isCanceling ? (
              <ActivityIndicator size="small" color="#FF6B6B" />
            ) : (
              <Text style={styles.cancelButtonText}>구독 취소</Text>
            )}
          </TouchableOpacity>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    fontSize: 16,
    color: '#FF9B7A',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  headerSpacer: {
    width: 50,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#999',
  },
  statusBadge: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgePremium: {
    backgroundColor: '#FFF0EB',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  statusBadgeTextPremium: {
    color: '#FF9B7A',
  },
  trialText: {
    fontSize: 13,
    color: '#FF9B7A',
    fontWeight: '500',
  },
  periodText: {
    fontSize: 13,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  tierSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tierTab: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  tierTabSelected: {
    borderColor: '#FF9B7A',
    backgroundColor: '#FFF9F5',
  },
  tierTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  tierTabTextSelected: {
    color: '#FF9B7A',
  },
  tierTabPrice: {
    fontSize: 13,
    color: '#999',
  },
  tierTabPriceSelected: {
    color: '#FF9B7A',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodTabSelected: {
    backgroundColor: '#fff',
  },
  periodTabText: {
    fontSize: 14,
    color: '#999',
  },
  periodTabTextSelected: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  planDetail: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  planDetailName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  planDetailPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF9B7A',
    marginBottom: 16,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
  },
  trialInfo: {
    fontSize: 13,
    color: '#FF9B7A',
    textAlign: 'center',
    marginBottom: 16,
  },
  checkoutButton: {
    backgroundColor: '#FF9B7A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#FFD0C2',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
});
