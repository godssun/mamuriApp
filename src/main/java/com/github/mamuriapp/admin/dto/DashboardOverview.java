package com.github.mamuriapp.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.Map;

/**
 * 대시보드 개요 KPI 응답.
 */
@Getter
@Builder
public class DashboardOverview {

    // 사용자 지표
    private final long totalUsers;
    private final long newUsersToday;
    private final long newUsersThisWeek;
    private final long newUsersThisMonth;

    // 활동 지표 (일기 작성 기준)
    private final long dau;
    private final long wau;
    private final long mau;
    private final double dauMauRatio;

    // 구독 지표
    private final Map<String, Long> subscriptionStatusDist;
    private final Map<String, Long> subscriptionTierDist;
    private final Map<String, Long> authProviderDist;

    // AI 지표
    private final long aiCallsToday;
    private final BigDecimal aiCostToday;
    private final BigDecimal aiCostThisMonth;

    // 대화 지표
    private final long activeConversationsToday;
    private final long userMessagesToday;
    private final long aiMessagesToday;

    // Engagement 지표
    private final long totalDiaries;
    private final double avgCurrentStreak;
    private final int maxCurrentStreak;
    private final double avgLongestStreak;

    // 안전 지표
    private final long safetyEventsToday;
    private final long safetyEventsThisWeek;

    // 이탈 지표
    private final long deletionsThisMonth;
}
