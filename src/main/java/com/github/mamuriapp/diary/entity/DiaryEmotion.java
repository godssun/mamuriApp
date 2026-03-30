package com.github.mamuriapp.diary.entity;

import com.github.mamuriapp.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 일기별 감정 기록 엔티티.
 */
@Entity
@Table(name = "diary_emotions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DiaryEmotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diary_id", nullable = false, unique = true)
    private Diary diary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "primary_emotion", length = 20)
    private String primaryEmotion;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "secondary_emotions", columnDefinition = "jsonb")
    private List<String> secondaryEmotions = new ArrayList<>();

    @Column(name = "emotion_score", nullable = false)
    private int emotionScore = 3;

    @Column(name = "ai_detected_emotion", length = 20)
    private String aiDetectedEmotion;

    @Column(name = "primary_sticker_id")
    private Long primaryStickerId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "secondary_sticker_ids", columnDefinition = "jsonb")
    private List<Long> secondaryStickerIds = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public DiaryEmotion(Diary diary, User user, String primaryEmotion,
                        List<String> secondaryEmotions, int emotionScore,
                        Long primaryStickerId, List<Long> secondaryStickerIds) {
        this.diary = diary;
        this.user = user;
        this.primaryEmotion = primaryEmotion;
        this.secondaryEmotions = secondaryEmotions != null ? secondaryEmotions : new ArrayList<>();
        this.emotionScore = emotionScore;
        this.primaryStickerId = primaryStickerId;
        this.secondaryStickerIds = secondaryStickerIds != null ? secondaryStickerIds : new ArrayList<>();
    }

    public void updateAiDetectedEmotion(String emotion) {
        this.aiDetectedEmotion = emotion;
    }

    public void update(String primaryEmotion, List<String> secondaryEmotions, int emotionScore) {
        this.primaryEmotion = primaryEmotion;
        this.secondaryEmotions = secondaryEmotions != null ? secondaryEmotions : this.secondaryEmotions;
        this.emotionScore = emotionScore;
    }

    public void updateSticker(Long primaryStickerId, List<Long> secondaryStickerIds) {
        this.primaryStickerId = primaryStickerId;
        this.secondaryStickerIds = secondaryStickerIds != null ? secondaryStickerIds : new ArrayList<>();
    }
}
