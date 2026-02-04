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
 * AI 코멘트 엔티티.
 * 일기에 대한 AI 응답을 저장한다.
 */
@Entity
@Table(name = "ai_comments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diary_id", nullable = false, unique = true)
    private Diary diary;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public AiComment(Diary diary, String content) {
        this.diary = diary;
        this.content = content;
    }

    /**
     * AI 코멘트 내용을 갱신한다 (재생성 시 사용).
     *
     * @param content 새로운 코멘트 내용
     */
    public void updateContent(String content) {
        this.content = content;
    }
}
