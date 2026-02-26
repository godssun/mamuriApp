package com.github.mamuriapp.ai.entity;

import com.github.mamuriapp.diary.entity.Diary;
import com.github.mamuriapp.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * AI 사용량 로그 엔티티.
 * AI 호출 비용 추적을 위한 기록.
 */
@Entity
@Table(name = "ai_usage_log")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiUsageLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diary_id")
    private Diary diary;

    @Column(name = "model_name")
    private String modelName;

    @Column(name = "total_tokens")
    private int totalTokens;

    @Column(name = "estimated_cost_krw", precision = 10, scale = 4)
    private BigDecimal estimatedCostKrw;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public AiUsageLog(User user, Diary diary, String modelName,
                      int totalTokens, BigDecimal estimatedCostKrw) {
        this.user = user;
        this.diary = diary;
        this.modelName = modelName;
        this.totalTokens = totalTokens;
        this.estimatedCostKrw = estimatedCostKrw;
    }
}
