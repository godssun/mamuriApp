package com.github.mamuriapp.diary.entity;

import com.github.mamuriapp.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 일기 엔티티.
 */
@Entity
@Table(name = "diaries", indexes = {
        @Index(name = "idx_diary_user_date", columnList = "user_id, diary_date DESC"),
        @Index(name = "idx_diary_date", columnList = "diary_date")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Diary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * 일기가 속한 날짜 (사용자가 선택한 날짜).
     * 실제 작성 시점(createdAt)과 다를 수 있음.
     */
    @Column(name = "diary_date", nullable = false)
    private LocalDate diaryDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public Diary(User user, String title, String content, LocalDate diaryDate) {
        this.user = user;
        this.title = title;
        this.content = content;
        this.diaryDate = diaryDate != null ? diaryDate : LocalDate.now();
    }

    /**
     * 일기 내용을 수정한다.
     *
     * @param title     변경할 제목
     * @param content   변경할 본문
     * @param diaryDate 변경할 일기 날짜 (null이면 기존 유지)
     */
    public void update(String title, String content, LocalDate diaryDate) {
        this.title = title;
        this.content = content;
        if (diaryDate != null) {
            this.diaryDate = diaryDate;
        }
    }
}
