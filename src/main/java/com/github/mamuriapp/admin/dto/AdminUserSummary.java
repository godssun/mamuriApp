package com.github.mamuriapp.admin.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * Admin 사용자 목록 요약 DTO.
 */
@Getter
@Builder
public class AdminUserSummary {

    private final Long id;
    private final String email;
    private final String nickname;
    private final String authProvider;
    private final String subscriptionStatus;
    private final String subscriptionTier;
    private final long diaryCount;
    private final int currentStreak;
    private final int longestStreak;
    private final String lastDiaryDate;
    private final String createdAt;
}
