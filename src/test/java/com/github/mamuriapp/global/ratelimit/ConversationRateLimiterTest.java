package com.github.mamuriapp.global.ratelimit;

import com.github.mamuriapp.user.entity.SubscriptionTier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

/**
 * ConversationRateLimiter 단위 테스트.
 */
class ConversationRateLimiterTest {

    private ConversationRateLimiter rateLimiter;
    private RateLimitProperties properties;

    @BeforeEach
    void setUp() {
        properties = new RateLimitProperties();
        properties.setFree(new RateLimitProperties.TierLimit(3, 10));
        properties.setDeluxe(new RateLimitProperties.TierLimit(10, 30));
        properties.setPremium(new RateLimitProperties.TierLimit(20, 60));
        properties.setEnabled(true);

        rateLimiter = new ConversationRateLimiter(properties);
    }

    @Test
    @DisplayName("FREE 티어: 분당 3회까지 허용, 4회째 차단")
    void free_perMinuteLimit() {
        Long userId = 1L;
        SubscriptionTier tier = SubscriptionTier.FREE;

        // 3회 성공
        for (int i = 0; i < 3; i++) {
            assertThatCode(() -> rateLimiter.checkRateLimit(userId, tier))
                    .doesNotThrowAnyException();
        }

        // 4회째 차단
        RateLimitExceededException ex = catchThrowableOfType(
                RateLimitExceededException.class,
                () -> rateLimiter.checkRateLimit(userId, tier));
        assertThat(ex).isNotNull();
        assertThat(ex.getRetryAfterSeconds()).isGreaterThan(0);
    }

    @Test
    @DisplayName("DELUXE 티어: 분당 10회까지 허용")
    void deluxe_perMinuteLimit() {
        Long userId = 2L;
        SubscriptionTier tier = SubscriptionTier.DELUXE;

        // 10회 성공
        for (int i = 0; i < 10; i++) {
            assertThatCode(() -> rateLimiter.checkRateLimit(userId, tier))
                    .doesNotThrowAnyException();
        }

        // 11회째 차단
        assertThatThrownBy(() -> rateLimiter.checkRateLimit(userId, tier))
                .isInstanceOf(RateLimitExceededException.class);
    }

    @Test
    @DisplayName("PREMIUM 티어: 분당 20회까지 허용")
    void premium_perMinuteLimit() {
        Long userId = 3L;
        SubscriptionTier tier = SubscriptionTier.PREMIUM;

        // 20회 성공
        for (int i = 0; i < 20; i++) {
            assertThatCode(() -> rateLimiter.checkRateLimit(userId, tier))
                    .doesNotThrowAnyException();
        }

        // 21회째 차단
        assertThatThrownBy(() -> rateLimiter.checkRateLimit(userId, tier))
                .isInstanceOf(RateLimitExceededException.class);
    }

    @Test
    @DisplayName("비활성화 시 제한 없음")
    void disabled_noLimit() {
        properties.setEnabled(false);
        Long userId = 4L;

        for (int i = 0; i < 100; i++) {
            assertThatCode(() -> rateLimiter.checkRateLimit(userId, SubscriptionTier.FREE))
                    .doesNotThrowAnyException();
        }
    }

    @Test
    @DisplayName("사용자별 독립적 카운팅")
    void perUser_independent() {
        Long user1 = 10L;
        Long user2 = 20L;
        SubscriptionTier tier = SubscriptionTier.FREE;

        // user1: 3회 사용
        for (int i = 0; i < 3; i++) {
            rateLimiter.checkRateLimit(user1, tier);
        }

        // user2: 여전히 사용 가능
        assertThatCode(() -> rateLimiter.checkRateLimit(user2, tier))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("resetUser 후 카운트 초기화")
    void resetUser_clearsHistory() {
        Long userId = 5L;
        SubscriptionTier tier = SubscriptionTier.FREE;

        // 3회 소진
        for (int i = 0; i < 3; i++) {
            rateLimiter.checkRateLimit(userId, tier);
        }

        // 차단 확인
        assertThatThrownBy(() -> rateLimiter.checkRateLimit(userId, tier))
                .isInstanceOf(RateLimitExceededException.class);

        // 초기화 후 다시 사용 가능
        rateLimiter.resetUser(userId);
        assertThatCode(() -> rateLimiter.checkRateLimit(userId, tier))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Retry-After 값이 1~60초 범위")
    void retryAfter_withinRange() {
        Long userId = 6L;
        SubscriptionTier tier = SubscriptionTier.FREE;

        for (int i = 0; i < 3; i++) {
            rateLimiter.checkRateLimit(userId, tier);
        }

        RateLimitExceededException ex = catchThrowableOfType(
                RateLimitExceededException.class,
                () -> rateLimiter.checkRateLimit(userId, tier));
        assertThat(ex).isNotNull();
        assertThat(ex.getRetryAfterSeconds()).isBetween(1L, 60L);
    }
}
