package com.github.mamuriapp.user.dto;

import com.github.mamuriapp.user.entity.SubscriptionStatus;
import com.github.mamuriapp.user.entity.SubscriptionTier;
import com.github.mamuriapp.user.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 구독 상태 응답 DTO.
 */
@Getter
@Builder
public class SubscriptionStatusResponse {

    private SubscriptionStatus status;
    private String tier;
    private boolean trialActive;
    private LocalDateTime trialEnd;
    private int dailyRepliesMax;  // -1 = unlimited, 0 = blocked
    private LocalDateTime currentPeriodEnd;
    private boolean crisisFlag;

    public static SubscriptionStatusResponse from(User user) {
        SubscriptionTier effectiveTier = user.getEffectiveTier();
        return SubscriptionStatusResponse.builder()
                .status(user.getSubscriptionStatus())
                .tier(effectiveTier.name())
                .trialActive(user.isTrialActive())
                .trialEnd(user.getTrialEnd())
                .dailyRepliesMax(effectiveTier.getMaxRepliesPerDay())
                .currentPeriodEnd(user.getCurrentPeriodEnd())
                .crisisFlag(user.hasCrisisFlag())
                .build();
    }
}
