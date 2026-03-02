package com.github.mamuriapp.user.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 구독 티어.
 * 티어별 일일 대화 제한을 정의한다.
 */
@Getter
@RequiredArgsConstructor
public enum SubscriptionTier {

    FREE(1),        // 하루 1회 맛보기
    DELUXE(3),      // 하루 3회
    PREMIUM(-1);    // 무제한 (-1)

    /** 하루 최대 AI 답변 횟수 (0 = 차단, -1 = 무제한) */
    private final int maxRepliesPerDay;

    /**
     * 오늘 사용량 기준으로 추가 답변이 가능한지 확인한다.
     *
     * @param usedToday 오늘 사용한 답변 횟수
     * @return 답변 가능 여부
     */
    public boolean canReply(int usedToday) {
        if (isUnlimited()) {
            return true;
        }
        return usedToday < maxRepliesPerDay;
    }

    /**
     * 무제한 티어인지 확인한다.
     *
     * @return PREMIUM이면 true
     */
    public boolean isUnlimited() {
        return maxRepliesPerDay == -1;
    }

    /**
     * 대화가 완전 차단된 티어인지 확인한다.
     *
     * @return 일일 허용 횟수가 0이면 true
     */
    public boolean isBlocked() {
        return maxRepliesPerDay == 0;
    }
}
