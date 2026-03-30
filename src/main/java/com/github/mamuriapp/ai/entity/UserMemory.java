package com.github.mamuriapp.ai.entity;

import com.github.mamuriapp.diary.entity.Diary;
import com.github.mamuriapp.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * AI 기억 엔티티.
 * 사용자의 일기에서 AI가 추출한 주요 정보를 저장한다.
 */
@Entity
@Table(name = "user_memories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserMemory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "memory_type", nullable = false, length = 30)
    private String memoryType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_diary_id")
    private Diary sourceDiary;

    @Column(nullable = false)
    private int importance = 1;

    @Column(name = "mention_count", nullable = false)
    private int mentionCount = 1;

    @Column(name = "last_referenced_at")
    private LocalDateTime lastReferencedAt;

    @Column(nullable = false, length = 10)
    private String status = "ACTIVE";

    /**
     * 기억 계층: SHORT_TERM, MID_TERM, LONG_TERM
     */
    @Column(name = "memory_tier", nullable = false, length = 15)
    private String memoryTier = "SHORT_TERM";

    /**
     * 감쇠 점수 (0.0~1.0). 낮을수록 사라질 가능성이 높다.
     */
    @Column(name = "decay_score", nullable = false)
    private double decayScore = 1.0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public UserMemory(User user, String memoryType, String content,
                      Diary sourceDiary, int importance, String memoryTier) {
        this.user = user;
        this.memoryType = memoryType;
        this.content = content;
        this.sourceDiary = sourceDiary;
        this.importance = importance;
        this.memoryTier = memoryTier != null ? memoryTier : "SHORT_TERM";
    }

    public void incrementMentionCount() {
        this.mentionCount++;
        this.importance = Math.min(5, 1 + this.mentionCount / 2);
    }

    public void markReferenced() {
        this.lastReferencedAt = LocalDateTime.now();
    }

    public void archive() {
        this.status = "ARCHIVED";
    }

    /**
     * 감쇠 점수를 적용한다.
     */
    public void applyDecay(double factor) {
        this.decayScore = Math.max(0.0, this.decayScore * factor);
    }

    /**
     * 기억 계층을 승격한다.
     */
    public void promoteTier(String newTier) {
        this.memoryTier = newTier;
        this.decayScore = 1.0; // 승격 시 감쇠 리셋
    }

    /**
     * 감쇠 점수가 임계값 이하인지 확인한다.
     */
    public boolean isDecayed(double threshold) {
        return this.decayScore <= threshold;
    }
}
