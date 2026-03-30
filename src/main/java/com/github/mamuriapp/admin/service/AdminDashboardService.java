package com.github.mamuriapp.admin.service;

import com.github.mamuriapp.admin.dto.*;
import com.github.mamuriapp.ai.repository.AiUsageLogRepository;
import com.github.mamuriapp.ai.repository.SafetyEventRepository;
import com.github.mamuriapp.diary.repository.ConversationMessageRepository;
import com.github.mamuriapp.diary.repository.DiaryRepository;
import com.github.mamuriapp.user.repository.AccountDeletionLogRepository;
import com.github.mamuriapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Admin 대시보드 메트릭 서비스.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final DiaryRepository diaryRepository;
    private final AiUsageLogRepository aiUsageLogRepository;
    private final SafetyEventRepository safetyEventRepository;
    private final AccountDeletionLogRepository accountDeletionLogRepository;
    private final ConversationMessageRepository conversationMessageRepository;

    /**
     * 대시보드 개요 KPI를 조회한다.
     */
    public DashboardOverview getOverview() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime startOfWeek = LocalDate.now().minusDays(6).atStartOfDay();
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        // 사용자 지표
        long totalUsers = userRepository.count();
        long newUsersToday = userRepository.countByCreatedAtAfter(startOfToday);
        long newUsersThisWeek = userRepository.countByCreatedAtAfter(startOfWeek);
        long newUsersThisMonth = userRepository.countByCreatedAtAfter(startOfMonth);

        // 활동 지표
        long dau = userRepository.countActiveWritersSince(startOfToday);
        long wau = userRepository.countActiveWritersSince(startOfWeek);
        long mau = userRepository.countActiveWritersSince(startOfMonth);

        // 구독 분포
        Map<String, Long> statusDist = userRepository.countBySubscriptionStatus().stream()
                .collect(Collectors.toMap(
                        r -> r[0].toString(),
                        r -> (Long) r[1],
                        (a, b) -> a,
                        LinkedHashMap::new));

        Map<String, Long> tierDist = userRepository.countBySubscriptionTier().stream()
                .collect(Collectors.toMap(
                        r -> r[0].toString(),
                        r -> (Long) r[1],
                        (a, b) -> a,
                        LinkedHashMap::new));

        Map<String, Long> providerDist = userRepository.countByAuthProvider().stream()
                .collect(Collectors.toMap(
                        r -> r[0].toString(),
                        r -> (Long) r[1],
                        (a, b) -> a,
                        LinkedHashMap::new));

        // AI 지표
        List<Object[]> aiToday = aiUsageLogRepository.findDailyUsageSummary(startOfToday);
        long aiCallsToday = 0;
        BigDecimal aiCostToday = BigDecimal.ZERO;
        if (!aiToday.isEmpty()) {
            aiCallsToday = (Long) aiToday.get(0)[1];
            aiCostToday = aiToday.get(0)[3] != null ? (BigDecimal) aiToday.get(0)[3] : BigDecimal.ZERO;
        }
        BigDecimal aiCostThisMonth = aiUsageLogRepository.findTotalCostSince(startOfMonth);
        if (aiCostThisMonth == null) aiCostThisMonth = BigDecimal.ZERO;

        // Engagement
        long totalDiaries = diaryRepository.count();
        Object[] streakStats = userRepository.findStreakStats();
        double avgCurrentStreak = streakStats[0] != null ? ((Number) streakStats[0]).doubleValue() : 0;
        int maxCurrentStreak = streakStats[1] != null ? ((Number) streakStats[1]).intValue() : 0;
        double avgLongestStreak = streakStats[2] != null ? ((Number) streakStats[2]).doubleValue() : 0;

        // 대화 지표
        long activeConvToday = conversationMessageRepository.countActiveConversationsSince(startOfToday);
        long userMsgToday = conversationMessageRepository.countByRoleAndCreatedAtAfter("USER", startOfToday);
        long aiMsgToday = conversationMessageRepository.countByRoleAndCreatedAtAfter("AI", startOfToday);

        // 안전
        long safetyToday = safetyEventRepository.countByCreatedAtAfter(startOfToday);
        long safetyWeek = safetyEventRepository.countByCreatedAtAfter(startOfWeek);

        // 이탈
        long deletionsMonth = accountDeletionLogRepository.countByDeletedAtAfter(startOfMonth);

        // DAU/MAU Stickiness
        double dauMauRatio = mau > 0 ? Math.round(dau * 1000.0 / mau) / 10.0 : 0;

        return DashboardOverview.builder()
                .totalUsers(totalUsers)
                .newUsersToday(newUsersToday)
                .newUsersThisWeek(newUsersThisWeek)
                .newUsersThisMonth(newUsersThisMonth)
                .dau(dau)
                .wau(wau)
                .mau(mau)
                .dauMauRatio(dauMauRatio)
                .subscriptionStatusDist(statusDist)
                .subscriptionTierDist(tierDist)
                .authProviderDist(providerDist)
                .aiCallsToday(aiCallsToday)
                .aiCostToday(aiCostToday)
                .aiCostThisMonth(aiCostThisMonth)
                .activeConversationsToday(activeConvToday)
                .userMessagesToday(userMsgToday)
                .aiMessagesToday(aiMsgToday)
                .totalDiaries(totalDiaries)
                .avgCurrentStreak(Math.round(avgCurrentStreak * 10.0) / 10.0)
                .maxCurrentStreak(maxCurrentStreak)
                .avgLongestStreak(Math.round(avgLongestStreak * 10.0) / 10.0)
                .safetyEventsToday(safetyToday)
                .safetyEventsThisWeek(safetyWeek)
                .deletionsThisMonth(deletionsMonth)
                .build();
    }

    /**
     * 일별 신규 가입 트렌드를 조회한다.
     */
    public TrendData getSignupTrend(int days) {
        LocalDateTime since = LocalDate.now().minusDays(days - 1).atStartOfDay();
        List<Object[]> raw = userRepository.findDailySignups(since);

        Map<LocalDate, Long> dataMap = raw.stream()
                .collect(Collectors.toMap(
                        r -> (LocalDate) r[0],
                        r -> (Long) r[1],
                        (a, b) -> a,
                        LinkedHashMap::new));

        List<String> labels = new ArrayList<>();
        List<Long> values = new ArrayList<>();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            labels.add(date.toString());
            values.add(dataMap.getOrDefault(date, 0L));
        }

        return TrendData.builder()
                .labels(labels)
                .values(values)
                .metric("signups")
                .build();
    }

    /**
     * DAU 트렌드를 조회한다.
     */
    public TrendData getDauTrend(int days) {
        LocalDateTime since = LocalDate.now().minusDays(days - 1).atStartOfDay();
        List<Object[]> raw = userRepository.findDailyActiveUsers(since);

        Map<LocalDate, Long> dataMap = raw.stream()
                .collect(Collectors.toMap(
                        r -> (LocalDate) r[0],
                        r -> (Long) r[1],
                        (a, b) -> a,
                        LinkedHashMap::new));

        List<String> labels = new ArrayList<>();
        List<Long> values = new ArrayList<>();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            labels.add(date.toString());
            values.add(dataMap.getOrDefault(date, 0L));
        }

        return TrendData.builder()
                .labels(labels)
                .values(values)
                .metric("dau")
                .build();
    }

    /**
     * AI 사용량 트렌드를 조회한다.
     */
    public AiUsageTrend getAiUsageTrend(int days) {
        LocalDateTime since = LocalDate.now().minusDays(days - 1).atStartOfDay();
        List<Object[]> raw = aiUsageLogRepository.findDailyUsageSummary(since);

        Map<LocalDate, Object[]> dataMap = raw.stream()
                .collect(Collectors.toMap(
                        r -> (LocalDate) r[0],
                        r -> r,
                        (a, b) -> a,
                        LinkedHashMap::new));

        List<String> labels = new ArrayList<>();
        List<Long> callCounts = new ArrayList<>();
        List<Long> tokenCounts = new ArrayList<>();
        List<BigDecimal> costs = new ArrayList<>();

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            labels.add(date.toString());
            Object[] row = dataMap.get(date);
            if (row != null) {
                callCounts.add((Long) row[1]);
                tokenCounts.add(row[2] != null ? ((Number) row[2]).longValue() : 0L);
                costs.add(row[3] != null ? (BigDecimal) row[3] : BigDecimal.ZERO);
            } else {
                callCounts.add(0L);
                tokenCounts.add(0L);
                costs.add(BigDecimal.ZERO);
            }
        }

        return AiUsageTrend.builder()
                .labels(labels)
                .callCounts(callCounts)
                .tokenCounts(tokenCounts)
                .costs(costs)
                .build();
    }

    /**
     * 리텐션 코호트 데이터를 조회한다.
     * 최근 N주의 주간 코호트별 D1, D7, D14, D30 리텐션.
     */
    public RetentionData getRetention(int weeks) {
        List<RetentionData.CohortRow> cohorts = new ArrayList<>();

        for (int w = weeks - 1; w >= 0; w--) {
            LocalDate weekStart = LocalDate.now().minusWeeks(w + 1).with(java.time.DayOfWeek.MONDAY);
            LocalDate weekEnd = weekStart.plusDays(7);

            LocalDateTime cohortStart = weekStart.atStartOfDay();
            LocalDateTime cohortEnd = weekEnd.atStartOfDay();

            long cohortSize = userRepository.countByCreatedAtBetween(cohortStart, cohortEnd);
            if (cohortSize == 0) {
                cohorts.add(RetentionData.CohortRow.builder()
                        .weekLabel(weekStart + " ~ " + weekEnd.minusDays(1))
                        .cohortSize(0)
                        .day1Retention(0)
                        .day7Retention(0)
                        .day14Retention(0)
                        .day30Retention(0)
                        .build());
                continue;
            }

            double d1 = safeRetention(cohortStart, cohortEnd, 24, cohortSize);
            double d7 = safeRetention(cohortStart, cohortEnd, 24 * 7, cohortSize);
            double d14 = safeRetention(cohortStart, cohortEnd, 24 * 14, cohortSize);
            double d30 = safeRetention(cohortStart, cohortEnd, 24 * 30, cohortSize);

            cohorts.add(RetentionData.CohortRow.builder()
                    .weekLabel(weekStart + " ~ " + weekEnd.minusDays(1))
                    .cohortSize(cohortSize)
                    .day1Retention(d1)
                    .day7Retention(d7)
                    .day14Retention(d14)
                    .day30Retention(d30)
                    .build());
        }

        return RetentionData.builder().cohorts(cohorts).build();
    }

    /**
     * 이탈 분석 데이터를 조회한다.
     */
    public ChurnAnalysis getChurnAnalysis() {
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        long thisMonth = accountDeletionLogRepository.countByDeletedAtAfter(startOfMonth);
        long allTime = accountDeletionLogRepository.count();

        Map<String, Long> reasonDist = accountDeletionLogRepository.countByReasonSince(
                        LocalDate.now().minusMonths(3).atStartOfDay()).stream()
                .collect(Collectors.toMap(
                        r -> r[0] != null ? (String) r[0] : "미지정",
                        r -> (Long) r[1],
                        (a, b) -> a,
                        LinkedHashMap::new));

        return ChurnAnalysis.builder()
                .totalDeletionsThisMonth(thisMonth)
                .totalDeletionsAllTime(allTime)
                .reasonDistribution(reasonDist)
                .build();
    }

    private double safeRetention(LocalDateTime cohortStart, LocalDateTime cohortEnd,
                                  int hoursAfter, long cohortSize) {
        try {
            long retained = userRepository.countRetainedUsers(cohortStart, cohortEnd, hoursAfter);
            return Math.round(retained * 1000.0 / cohortSize) / 10.0;
        } catch (Exception e) {
            return 0;
        }
    }
}
