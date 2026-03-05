package com.github.mamuriapp.user.entity;

/**
 * 구독 상태.
 */
public enum SubscriptionStatus {

    FREE,
    TRIALING,
    ACTIVE,
    PAST_DUE,
    CANCELED;

    /**
     * 프리미엄 사용자인지 확인한다.
     *
     * @return ACTIVE 또는 TRIALING이면 true
     */
    public boolean isPremium() {
        return this == ACTIVE || this == TRIALING;
    }
}
