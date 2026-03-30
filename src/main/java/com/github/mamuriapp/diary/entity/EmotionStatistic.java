package com.github.mamuriapp.diary.entity;

import com.github.mamuriapp.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 감정 통계 엔티티.
 * 주간/월간 감정 분포를 사전 집계하여 빠른 조회를 지원한다.
 */
@Entity
@Table(name = "emotion_statistics", indexes = {
        @Index(name = "idx_emotion_statistics_user", columnList = "user_id, period_type, period_key")
}, uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "period_type", "period_key", "emotion_code"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmotionStatistic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 기간 유형: WEEKLY, MONTHLY
     */
    @Column(name = "period_type", nullable = false, length = 10)
    private String periodType;

    /**
     * 기간 키: "2026-W13" (주간) 또는 "2026-03" (월간)
     */
    @Column(name = "period_key", nullable = false, length = 10)
    private String periodKey;

    @Column(name = "emotion_code", nullable = false, length = 30)
    private String emotionCode;

    @Column(nullable = false)
    private int count;

    @Column(name = "avg_score", nullable = false)
    private double avgScore;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public EmotionStatistic(User user, String periodType, String periodKey,
                            String emotionCode, int count, double avgScore) {
        this.user = user;
        this.periodType = periodType;
        this.periodKey = periodKey;
        this.emotionCode = emotionCode;
        this.count = count;
        this.avgScore = avgScore;
    }

    public void updateStats(int count, double avgScore) {
        this.count = count;
        this.avgScore = avgScore;
    }
}
