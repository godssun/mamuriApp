package com.github.mamuriapp.ai.entity;

import com.github.mamuriapp.diary.entity.Diary;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 안전 이벤트 엔티티 (MVP-lite).
 * 위기 관련 콘텐츠가 감지되었을 때 기록한다.
 */
@Entity
@Table(name = "safety_events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SafetyEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diary_id", nullable = false)
    private Diary diary;

    /** 감지된 위험 유형 (예: self_harm, crisis) */
    @Column(name = "event_type", nullable = false)
    private String eventType;

    /** 감지 신뢰도 점수 (0.0 ~ 1.0) */
    @Column(name = "confidence_score")
    private Double confidenceScore;

    /** 취해진 조치에 대한 설명 */
    @Column(name = "action_taken")
    private String actionTaken;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public SafetyEvent(Diary diary, String eventType,
                       Double confidenceScore, String actionTaken) {
        this.diary = diary;
        this.eventType = eventType;
        this.confidenceScore = confidenceScore;
        this.actionTaken = actionTaken;
    }
}
