package com.github.mamuriapp.diary.entity;

import com.github.mamuriapp.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 대화 메시지 엔티티.
 * 일기에 대한 다회차 대화(사용자 질문 + AI 답변)를 저장한다.
 */
@Entity
@Table(name = "conversation_messages")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ConversationMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diary_id", nullable = false)
    private Diary diary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 10)
    private String role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "sequence_number", nullable = false)
    private int sequenceNumber;

    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "prompt_version", length = 50)
    private String promptVersion;

    @Column(name = "token_count")
    private Integer tokenCount;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public ConversationMessage(Diary diary, User user, String role, String content,
                                int sequenceNumber, String modelName, String promptVersion,
                                Integer tokenCount) {
        this.diary = diary;
        this.user = user;
        this.role = role;
        this.content = content;
        this.sequenceNumber = sequenceNumber;
        this.modelName = modelName;
        this.promptVersion = promptVersion;
        this.tokenCount = tokenCount;
    }
}
