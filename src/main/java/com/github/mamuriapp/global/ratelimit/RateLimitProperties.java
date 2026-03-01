package com.github.mamuriapp.global.ratelimit;

import com.github.mamuriapp.user.entity.SubscriptionTier;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 대화 Rate Limit 설정.
 * 티어별 분당/시간당 요청 제한을 정의한다.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "rate-limit.conversation")
public class RateLimitProperties {

    /** Rate limit 활성화 여부 (기본: true) */
    private boolean enabled = true;

    private TierLimit free = new TierLimit(3, 10);
    private TierLimit deluxe = new TierLimit(10, 30);
    private TierLimit premium = new TierLimit(20, 60);

    /**
     * 티어에 해당하는 제한을 반환한다.
     *
     * @param tier 구독 티어
     * @return 제한 설정
     */
    public TierLimit getLimit(SubscriptionTier tier) {
        return switch (tier) {
            case FREE -> free;
            case DELUXE -> deluxe;
            case PREMIUM -> premium;
        };
    }

    @Getter
    @Setter
    public static class TierLimit {
        /** 분당 최대 요청 수 */
        private int perMinute;
        /** 시간당 최대 요청 수 */
        private int perHour;

        public TierLimit() {}

        public TierLimit(int perMinute, int perHour) {
            this.perMinute = perMinute;
            this.perHour = perHour;
        }
    }
}
