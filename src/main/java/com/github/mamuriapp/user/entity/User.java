package com.github.mamuriapp.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 사용자 엔티티.
 */
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@BatchSize(size = 20)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String nickname;

    @Column(name = "ai_name")
    private String aiName = "마음이";

    @Column(name = "max_level", nullable = false)
    private int maxLevel = 1;

    @Column(name = "diary_count", nullable = false)
    private long diaryCount = 0;

    @Column(name = "refresh_token")
    private String refreshToken;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // -- 구독/쿼터 필드 --

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_status", nullable = false)
    private SubscriptionStatus subscriptionStatus = SubscriptionStatus.FREE;

    @Column(name = "current_period_end")
    private LocalDateTime currentPeriodEnd;

    @Column(name = "grace_period_end")
    private LocalDateTime gracePeriodEnd;

    @Column(name = "stripe_customer_id")
    private String stripeCustomerId;

    @Column(name = "stripe_subscription_id")
    private String stripeSubscriptionId;

    @Column(name = "quota_used", nullable = false)
    private int quotaUsed = 0;

    @Column(name = "quota_reset_date")
    private LocalDate quotaResetDate;

    @Column(name = "crisis_flag_until")
    private LocalDateTime crisisFlagUntil;

    // -- 스트릭 필드 --

    @Column(name = "current_streak", nullable = false)
    private int currentStreak = 0;

    @Column(name = "longest_streak", nullable = false)
    private int longestStreak = 0;

    @Column(name = "last_diary_date")
    private LocalDate lastDiaryDate;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @Builder
    public User(String email, String password, String nickname, String aiName) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.aiName = (aiName != null && !aiName.isBlank()) ? aiName : "마음이";
    }

    /**
     * 리프레시 토큰을 갱신한다.
     *
     * @param refreshToken 새로운 리프레시 토큰
     */
    public void updateRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public void updateAiName(String aiName) {
        this.aiName = aiName;
    }

    public void updateMaxLevel(int level) {
        if (level > this.maxLevel) {
            this.maxLevel = level;
        }
    }

    public void incrementDiaryCount() {
        this.diaryCount++;
    }

    public void decrementDiaryCount() {
        if (this.diaryCount > 0) {
            this.diaryCount--;
        }
    }

    // -- 구독/쿼터 메서드 --

    public boolean isPremium() {
        return subscriptionStatus != null && subscriptionStatus.isPremium();
    }

    public void incrementQuotaUsed() {
        this.quotaUsed++;
    }

    public void resetQuota() {
        this.quotaUsed = 0;
        this.quotaResetDate = LocalDate.now().withDayOfMonth(1).plusMonths(1);
    }

    public boolean hasCrisisFlag() {
        return crisisFlagUntil != null && crisisFlagUntil.isAfter(LocalDateTime.now());
    }

    public void setCrisisFlag() {
        this.crisisFlagUntil = LocalDateTime.now().plusDays(7);
    }

    public void updateSubscription(SubscriptionStatus status, LocalDateTime periodEnd) {
        this.subscriptionStatus = status;
        this.currentPeriodEnd = periodEnd;
    }

    public void updateStripeCustomerId(String id) {
        this.stripeCustomerId = id;
    }

    public void updateStripeSubscriptionId(String id) {
        this.stripeSubscriptionId = id;
    }

    public void updateGracePeriodEnd(LocalDateTime end) {
        this.gracePeriodEnd = end;
    }

    // -- 스트릭 메서드 --

    public void updateStreak(LocalDate diaryDate) {
        if (diaryDate == null) return;

        if (this.lastDiaryDate == null) {
            // 첫 일기
            this.currentStreak = 1;
            this.longestStreak = Math.max(this.longestStreak, 1);
            this.lastDiaryDate = diaryDate;
        } else if (diaryDate.equals(this.lastDiaryDate)) {
            // 같은 날 → 변화 없음
        } else if (diaryDate.isBefore(this.lastDiaryDate)) {
            // 과거 날짜 → 무시 (MVP)
        } else if (diaryDate.equals(this.lastDiaryDate.plusDays(1))) {
            // 연속일
            this.currentStreak++;
            this.longestStreak = Math.max(this.longestStreak, this.currentStreak);
            this.lastDiaryDate = diaryDate;
        } else {
            // 공백 → 리셋
            this.currentStreak = 1;
            this.longestStreak = Math.max(this.longestStreak, this.currentStreak);
            this.lastDiaryDate = diaryDate;
        }
    }

    public void resetStreakData() {
        this.currentStreak = 0;
        this.lastDiaryDate = null;
    }

    public void setStreakData(int currentStreak, LocalDate lastDiaryDate) {
        this.currentStreak = currentStreak;
        this.lastDiaryDate = lastDiaryDate;
        // longestStreak은 줄이지 않음
    }
}
