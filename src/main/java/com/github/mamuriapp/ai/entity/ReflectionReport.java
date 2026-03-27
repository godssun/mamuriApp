package com.github.mamuriapp.ai.entity;

import com.github.mamuriapp.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 리플렉션 리포트 엔티티.
 */
@Entity
@Table(name = "reflection_reports")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReflectionReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "report_type", nullable = false, length = 20)
    private String reportType;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "emotion_summary", columnDefinition = "jsonb")
    private Map<String, Object> emotionSummary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "key_events", columnDefinition = "jsonb")
    private List<String> keyEvents;

    @Column(name = "growth_insight", columnDefinition = "TEXT")
    private String growthInsight;

    @Column(name = "diary_count", nullable = false)
    private int diaryCount;

    @Column(nullable = false, length = 10)
    private String status = "GENERATED";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public ReflectionReport(User user, String reportType, LocalDate periodStart,
                            LocalDate periodEnd, String title, String content,
                            Map<String, Object> emotionSummary, List<String> keyEvents,
                            String growthInsight, int diaryCount) {
        this.user = user;
        this.reportType = reportType;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.title = title;
        this.content = content;
        this.emotionSummary = emotionSummary;
        this.keyEvents = keyEvents;
        this.growthInsight = growthInsight;
        this.diaryCount = diaryCount;
    }

    public void markRead() {
        this.status = "READ";
    }
}
