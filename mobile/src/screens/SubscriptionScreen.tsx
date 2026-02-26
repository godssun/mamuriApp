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

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Subscription'>;
};

const PLANS = [
  {
    id: 'monthly',
    name: '월간',
    price: '4,900원',
    period: '/월',
    priceId: 'price_monthly',
  },
  {
    id: 'yearly',
    name: '연간',
    price: '49,000원',
    period: '/년',
    priceId: 'price_yearly',
    badge: '17% 할인',
  },
];

export default function SubscriptionScreen({ navigation }: Props) {
  const { info, isPremium, quotaRemaining, refresh } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const quotaUsed = info?.quotaUsed ?? 0;
  const quotaLimit = info?.quotaLimit ?? 20;
  const quotaProgress = quotaLimit > 0 ? Math.min(quotaUsed / quotaLimit, 1) : 0;

  const handleCheckout = async () => {
    const plan = PLANS.find((p) => p.id === selectedPlan);
    if (!plan) return;

    setIsLoading(true);
    try {
      const { checkoutUrl } = await subscriptionApi.createCheckout(plan.priceId);
      await Linking.openURL(checkoutUrl);
      // 결제 완료 후 돌아오면 상태 갱신
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>구독 관리</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* 현재 상태 */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>현재 플랜</Text>
            <View style={[styles.statusBadge, isPremium && styles.statusBadgePremium]}>
              <Text style={[styles.statusBadgeText, isPremium && styles.statusBadgeTextPremium]}>
                {isPremium ? '프리미엄' : '무료'}
              </Text>
            </View>
          </View>

          {isPremium && info?.currentPeriodEnd && (
            <Text style={styles.periodText}>
              다음 결제일: {formatDate(info.currentPeriodEnd)}
            </Text>
          )}

          {/* 쿼터 사용량 */}
          {!isPremium && (
            <View style={styles.quotaSection}>
              <View style={styles.quotaHeader}>
                <Text style={styles.quotaLabel}>AI 코멘트 사용량</Text>
                <Text style={styles.quotaCount}>{quotaUsed}/{quotaLimit}</Text>
              </View>
              <View style={styles.quotaBarBg}>
                <View
                  style={[
                    styles.quotaBarFill,
                    { width: `${quotaProgress * 100}%` },
                    quotaProgress >= 0.8 && styles.quotaBarWarning,
                    quotaProgress >= 1 && styles.quotaBarFull,
                  ]}
                />
              </View>
              {quotaRemaining <= 5 && quotaRemaining > 0 && (
                <Text style={styles.quotaWarning}>
                  {quotaRemaining}건 남았어요
                </Text>
              )}
              {quotaRemaining <= 0 && (
                <Text style={styles.quotaExhausted}>
                  이번 달 사용량을 모두 소진했어요
                </Text>
              )}
            </View>
          )}
        </View>

        {/* 프리미엄 플랜 선택 (비프리미엄만) */}
        {!isPremium && (
          <>
            <Text style={styles.sectionTitle}>프리미엄 플랜</Text>
            <View style={styles.plansContainer}>
              {PLANS.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    selectedPlan === plan.id && styles.planCardSelected,
                  ]}
                  onPress={() => setSelectedPlan(plan.id)}
                >
                  {plan.badge && (
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeText}>{plan.badge}</Text>
                    </View>
                  )}
                  <Text style={[
                    styles.planName,
                    selectedPlan === plan.id && styles.planNameSelected,
                  ]}>
                    {plan.name}
                  </Text>
                  <Text style={[
                    styles.planPrice,
                    selectedPlan === plan.id && styles.planPriceSelected,
                  ]}>
                    {plan.price}
                  </Text>
                  <Text style={[
                    styles.planPeriod,
                    selectedPlan === plan.id && styles.planPeriodSelected,
                  ]}>
                    {plan.period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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

        {/* 구독 취소 (프리미엄만) */}
        {isPremium && (
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
    marginBottom: 12,
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
  periodText: {
    fontSize: 13,
    color: '#666',
  },
  quotaSection: {
    marginTop: 4,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quotaLabel: {
    fontSize: 14,
    color: '#2D2D2D',
    fontWeight: '500',
  },
  quotaCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  quotaBarBg: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  quotaBarFill: {
    height: '100%',
    backgroundColor: '#FF9B7A',
    borderRadius: 4,
  },
  quotaBarWarning: {
    backgroundColor: '#FFB347',
  },
  quotaBarFull: {
    backgroundColor: '#FF6B6B',
  },
  quotaWarning: {
    fontSize: 12,
    color: '#FFB347',
    marginTop: 6,
  },
  quotaExhausted: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  plansContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  planCardSelected: {
    borderColor: '#FF9B7A',
    backgroundColor: '#FFF9F5',
  },
  planBadge: {
    backgroundColor: '#FF9B7A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 8,
  },
  planBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  planName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  planNameSelected: {
    color: '#FF9B7A',
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 2,
  },
  planPriceSelected: {
    color: '#FF9B7A',
  },
  planPeriod: {
    fontSize: 13,
    color: '#999',
  },
  planPeriodSelected: {
    color: '#FF9B7A',
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
