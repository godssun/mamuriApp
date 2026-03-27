package com.github.mamuriapp.admin.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * Admin 사용자 상세 DTO.
 */
@Getter
@Builder
public class AdminUserDetail {

    private final Long id;
    private final String email;
    private final String nickname;
    private final String authProvider;
    private final String profileImageUrl;

    // AI 설정
    private final String aiName;
    private final int maxLevel;

    // 구독
    private final String subscriptionStatus;
    private final String subscriptionTier;
    private final String currentPeriodEnd;
    private final String stripeCustomerId;
    private final int quotaUsed;

    // 활동
    private final long diaryCount;
    private final int currentStreak;
    private final int longestStreak;
    private final String lastDiaryDate;

    // 시간
    private final String createdAt;
    private final String updatedAt;
}
