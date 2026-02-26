package com.github.mamuriapp.user.dto;

import com.github.mamuriapp.user.entity.SubscriptionStatus;
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
    private int quotaUsed;
    private int quotaLimit;
    private LocalDateTime currentPeriodEnd;
    private boolean crisisFlag;

    public static SubscriptionStatusResponse from(User user) {
        return SubscriptionStatusResponse.builder()
                .status(user.getSubscriptionStatus())
                .quotaUsed(user.getQuotaUsed())
                .quotaLimit(user.isPremium() ? -1 : 20)
                .currentPeriodEnd(user.getCurrentPeriodEnd())
                .crisisFlag(user.hasCrisisFlag())
                .build();
    }
}
