package com.github.mamuriapp.user.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * User 엔티티 구독/쿼터 메서드 단위 테스트.
 */
class UserTest {

    private User createUser() {
        return User.builder()
                .email("test@example.com")
                .password("password")
                .nickname("테스트")
                .build();
    }

    // --- isPremium ---

    @Nested
    @DisplayName("isPremium")
    class IsPremium {

        @Test
        @DisplayName("ACTIVE 상태이면 true를 반환한다")
        void isPremium_active_returnsTrue() {
            // given
            User user = createUser();
            user.updateSubscription(SubscriptionStatus.ACTIVE, LocalDateTime.now().plusDays(30));

            // when & then
            assertThat(user.isPremium()).isTrue();
        }

        @Test
        @DisplayName("TRIALING 상태이면 true를 반환한다")
        void isPremium_trialing_returnsTrue() {
            // given
            User user = createUser();
            user.updateSubscription(SubscriptionStatus.TRIALING, LocalDateTime.now().plusDays(14));

            // when & then
            assertThat(user.isPremium()).isTrue();
        }

        @Test
        @DisplayName("FREE 상태이면 false를 반환한다")
        void isPremium_free_returnsFalse() {
            // given
            User user = createUser();
            // FREE는 기본값이므로 별도 설정 불필요

            // when & then
            assertThat(user.isPremium()).isFalse();
        }

        @Test
        @DisplayName("PAST_DUE 상태이면 false를 반환한다")
        void isPremium_pastDue_returnsFalse() {
            // given
            User user = createUser();
            user.updateSubscription(SubscriptionStatus.PAST_DUE, LocalDateTime.now().plusDays(3));

            // when & then
            assertThat(user.isPremium()).isFalse();
        }

        @Test
        @DisplayName("CANCELED 상태이면 false를 반환한다")
        void isPremium_canceled_returnsFalse() {
            // given
            User user = createUser();
            user.updateSubscription(SubscriptionStatus.CANCELED, null);

            // when & then
            assertThat(user.isPremium()).isFalse();
        }
    }

    // --- hasCrisisFlag ---

    @Nested
    @DisplayName("hasCrisisFlag")
    class HasCrisisFlag {

        @Test
        @DisplayName("crisisFlagUntil이 미래 시점이면 true를 반환한다")
        void hasCrisisFlag_withinSevenDays_returnsTrue() {
            // given
            User user = createUser();
            ReflectionTestUtils.setField(user, "crisisFlagUntil", LocalDateTime.now().plusDays(5));

            // when & then
            assertThat(user.hasCrisisFlag()).isTrue();
        }

        @Test
        @DisplayName("crisisFlagUntil이 과거이면 false를 반환한다")
        void hasCrisisFlag_expired_returnsFalse() {
            // given
            User user = createUser();
            ReflectionTestUtils.setField(user, "crisisFlagUntil", LocalDateTime.now().minusDays(1));

            // when & then
            assertThat(user.hasCrisisFlag()).isFalse();
        }

        @Test
        @DisplayName("crisisFlagUntil이 null이면 false를 반환한다")
        void hasCrisisFlag_null_returnsFalse() {
            // given
            User user = createUser();
            // crisisFlagUntil 기본값은 null

            // when & then
            assertThat(user.hasCrisisFlag()).isFalse();
        }
    }

    // --- incrementQuotaUsed ---

    @Test
    @DisplayName("incrementQuotaUsed 호출 시 quotaUsed가 1 증가한다")
    void incrementQuotaUsed_increasesCount() {
        // given
        User user = createUser();
        assertThat(user.getQuotaUsed()).isZero();

        // when
        user.incrementQuotaUsed();

        // then
        assertThat(user.getQuotaUsed()).isEqualTo(1);

        // when (두 번째 호출)
        user.incrementQuotaUsed();

        // then
        assertThat(user.getQuotaUsed()).isEqualTo(2);
    }

    // --- resetQuota ---

    @Test
    @DisplayName("resetQuota 호출 시 quotaUsed가 0으로 리셋되고 quotaResetDate가 다음 달 1일로 설정된다")
    void resetQuota_resetsToZero_setsNextMonth() {
        // given
        User user = createUser();
        user.incrementQuotaUsed();
        user.incrementQuotaUsed();
        user.incrementQuotaUsed();
        assertThat(user.getQuotaUsed()).isEqualTo(3);

        // when
        user.resetQuota();

        // then
        assertThat(user.getQuotaUsed()).isZero();
        LocalDate expectedResetDate = LocalDate.now().withDayOfMonth(1).plusMonths(1);
        assertThat(user.getQuotaResetDate()).isEqualTo(expectedResetDate);
    }
}
