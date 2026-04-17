package com.github.mamuriapp.schedule.entity;

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
 * 사용자의 가벼운 일정(Schedule) — 생산성 도구가 아니라
 * "하루 리듬을 함께 지켜주는 조용한 일정"으로 설계된 MVP.
 *
 * - 제목 + 시작(+종료?) + 노트 + 종일 여부 + 일기 연결만 보유
 * - 반복·카테고리·공유는 Phase2 이후
 */
@Entity
@Table(name = "schedules", indexes = {
    @Index(name = "idx_schedule_user_start", columnList = "user_id, start_at DESC"),
    @Index(name = "idx_schedule_linked_diary", columnList = "linked_diary_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Column(name = "end_at")
    private LocalDateTime endAt;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "is_all_day", nullable = false)
    private boolean isAllDay = false;

    /**
     * 일기와의 수동 연결. 서로 다른 도메인이므로 FK는 soft link(Long)로 보관하고
     * 일기가 삭제되면 마이그레이션에서 ON DELETE SET NULL 처리.
     */
    @Column(name = "linked_diary_id")
    private Long linkedDiaryId;

    @Column(length = 20, nullable = false)
    private String color = "sage";

    @Column(nullable = false)
    private boolean completed = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Schedule(User user, String title, LocalDateTime startAt, LocalDateTime endAt,
                    String note, Boolean isAllDay, Long linkedDiaryId, String color) {
        this.user = user;
        this.title = title;
        this.startAt = startAt;
        this.endAt = endAt;
        this.note = note;
        this.isAllDay = isAllDay != null && isAllDay;
        this.linkedDiaryId = linkedDiaryId;
        this.color = color != null ? color : "sage";
    }

    public void update(String title, LocalDateTime startAt, LocalDateTime endAt,
                       String note, Boolean isAllDay, Long linkedDiaryId, String color) {
        if (title != null) this.title = title;
        if (startAt != null) this.startAt = startAt;
        this.endAt = endAt;
        this.note = note;
        if (isAllDay != null) this.isAllDay = isAllDay;
        this.linkedDiaryId = linkedDiaryId;
        if (color != null) this.color = color;
    }

    public void toggleComplete() {
        this.completed = !this.completed;
    }
}
