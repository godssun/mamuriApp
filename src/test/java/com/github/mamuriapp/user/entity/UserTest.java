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

    // --- updateStreak ---

    @Nested
    @DisplayName("updateStreak")
    class UpdateStreak {

        @Test
        @DisplayName("첫 일기 작성 시 streak=1, longestStreak=1로 설정된다")
        void updateStreak_firstDiary_setsStreakToOne() {
            // given
            User user = createUser();
            LocalDate today = LocalDate.now();

            // when
            user.updateStreak(today);

            // then
            assertThat(user.getCurrentStreak()).isEqualTo(1);
            assertThat(user.getLongestStreak()).isEqualTo(1);
            assertThat(user.getLastDiaryDate()).isEqualTo(today);
        }

        @Test
        @DisplayName("연속 일기 작성 시 streak이 증가한다")
        void updateStreak_consecutive_incrementsStreak() {
            // given
            User user = createUser();
            LocalDate day1 = LocalDate.of(2026, 2, 28);
            LocalDate day2 = LocalDate.of(2026, 3, 1);
            LocalDate day3 = LocalDate.of(2026, 3, 2);

            // when
            user.updateStreak(day1);
            user.updateStreak(day2);
            user.updateStreak(day3);

            // then
            assertThat(user.getCurrentStreak()).isEqualTo(3);
            assertThat(user.getLongestStreak()).isEqualTo(3);
            assertThat(user.getLastDiaryDate()).isEqualTo(day3);
        }

        @Test
        @DisplayName("같은 날 여러 일기 작성 시 streak이 변하지 않는다")
        void updateStreak_sameDay_noChange() {
            // given
            User user = createUser();
            LocalDate today = LocalDate.now();

            // when
            user.updateStreak(today);
            user.updateStreak(today);
            user.updateStreak(today);

            // then
            assertThat(user.getCurrentStreak()).isEqualTo(1);
            assertThat(user.getLongestStreak()).isEqualTo(1);
        }

        @Test
        @DisplayName("공백 발생 시 streak이 1로 리셋된다 (longestStreak 유지)")
        void updateStreak_gap_resetsStreak() {
            // given
            User user = createUser();
            LocalDate day1 = LocalDate.of(2026, 2, 25);
            LocalDate day2 = LocalDate.of(2026, 2, 26);
            LocalDate day3 = LocalDate.of(2026, 2, 27);
            LocalDate day5 = LocalDate.of(2026, 3, 1); // 1일 공백

            // when
            user.updateStreak(day1);
            user.updateStreak(day2);
            user.updateStreak(day3);
            assertThat(user.getCurrentStreak()).isEqualTo(3);

            user.updateStreak(day5);

            // then
            assertThat(user.getCurrentStreak()).isEqualTo(1);
            assertThat(user.getLongestStreak()).isEqualTo(3); // 유지
            assertThat(user.getLastDiaryDate()).isEqualTo(day5);
        }

        @Test
        @DisplayName("과거 날짜 일기 작성 시 streak이 변하지 않는다")
        void updateStreak_pastDate_ignored() {
            // given
            User user = createUser();
            LocalDate today = LocalDate.of(2026, 3, 1);
            LocalDate yesterday = LocalDate.of(2026, 2, 28);

            // when
            user.updateStreak(today);
            user.updateStreak(yesterday); // 과거 날짜

            // then
            assertThat(user.getCurrentStreak()).isEqualTo(1);
            assertThat(user.getLastDiaryDate()).isEqualTo(today); // 변경 없음
        }

        @Test
        @DisplayName("null 날짜는 무시된다")
        void updateStreak_nullDate_ignored() {
            // given
            User user = createUser();

            // when
            user.updateStreak(null);

            // then
            assertThat(user.getCurrentStreak()).isZero();
            assertThat(user.getLastDiaryDate()).isNull();
        }

        @Test
        @DisplayName("longestStreak은 공백 후에도 줄어들지 않는다")
        void updateStreak_longestStreakNeverDecreases() {
            // given
            User user = createUser();
            LocalDate day1 = LocalDate.of(2026, 1, 1);
            LocalDate day2 = LocalDate.of(2026, 1, 2);
            LocalDate day3 = LocalDate.of(2026, 1, 3);
            LocalDate day4 = LocalDate.of(2026, 1, 4);
            LocalDate day5 = LocalDate.of(2026, 1, 5);

            // 5일 연속
            user.updateStreak(day1);
            user.updateStreak(day2);
            user.updateStreak(day3);
            user.updateStreak(day4);
            user.updateStreak(day5);
            assertThat(user.getLongestStreak()).isEqualTo(5);

            // 공백 후 2일 연속
            LocalDate day10 = LocalDate.of(2026, 1, 10);
            LocalDate day11 = LocalDate.of(2026, 1, 11);
            user.updateStreak(day10);
            user.updateStreak(day11);

            // then
            assertThat(user.getCurrentStreak()).isEqualTo(2);
            assertThat(user.getLongestStreak()).isEqualTo(5); // 유지
        }
    }

    // --- resetStreakData ---

    @Test
    @DisplayName("resetStreakData 호출 시 currentStreak=0, lastDiaryDate=null이 된다")
    void resetStreakData_resetsCurrentStreakAndDate() {
        // given
        User user = createUser();
        user.updateStreak(LocalDate.now());
        assertThat(user.getCurrentStreak()).isEqualTo(1);

        // when
        user.resetStreakData();

        // then
        assertThat(user.getCurrentStreak()).isZero();
        assertThat(user.getLastDiaryDate()).isNull();
    }

    // --- setStreakData ---

    @Test
    @DisplayName("setStreakData는 currentStreak과 lastDiaryDate만 변경하고 longestStreak은 유지한다")
    void setStreakData_updatesCurrentOnly() {
        // given
        User user = createUser();
        // 5일 연속으로 longestStreak=5 만듬
        for (int i = 0; i < 5; i++) {
            user.updateStreak(LocalDate.of(2026, 1, 1).plusDays(i));
        }
        assertThat(user.getLongestStreak()).isEqualTo(5);

        // when
        user.setStreakData(2, LocalDate.of(2026, 2, 1));

        // then
        assertThat(user.getCurrentStreak()).isEqualTo(2);
        assertThat(user.getLastDiaryDate()).isEqualTo(LocalDate.of(2026, 2, 1));
        assertThat(user.getLongestStreak()).isEqualTo(5); // 유지
    }
}
