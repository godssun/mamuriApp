package com.github.mamuriapp.diary.dto;

import com.github.mamuriapp.ai.dto.AiCommentResponse;
import com.github.mamuriapp.diary.entity.Diary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 일기 응답 DTO.
 */
@Getter
@AllArgsConstructor
@Builder
public class DiaryResponse {

    private Long id;
    private String title;
    private String content;
    private LocalDate diaryDate;
    private String diaryType;
    private String theme;
    private AiCommentResponse aiComment;
    private EmotionInfo emotion;
    private LevelUpInfo levelUp;
    private StreakInfo streak;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * 감정 정보.
     */
    @Getter
    @AllArgsConstructor
    @Builder
    public static class EmotionInfo {
        private String primaryEmotion;
        private int emotionScore;
        private Long primaryStickerId;
        private String stickerCode;
        private String stickerImageUrl;
        private List<Long> secondaryStickerIds;
    }

    /**
     * 레벨업 정보.
     */
    @Getter
    @AllArgsConstructor
    public static class LevelUpInfo {
        private int oldLevel;
        private int newLevel;
    }

    /**
     * 스트릭 정보.
     */
    @Getter
    @AllArgsConstructor
    public static class StreakInfo {
        private int currentStreak;
        private int longestStreak;
        private boolean streakActive;
    }

    /**
     * 엔티티를 DTO로 변환한다 (AI 코멘트 없이).
     */
    public static DiaryResponse from(Diary diary) {
        return DiaryResponse.builder()
                .id(diary.getId())
                .title(diary.getTitle())
                .content(diary.getContent())
                .diaryDate(diary.getDiaryDate())
                .diaryType(diary.getDiaryType())
                .theme(diary.getTheme())
                .createdAt(diary.getCreatedAt())
                .updatedAt(diary.getUpdatedAt())
                .build();
    }

    /**
     * 엔티티를 DTO로 변환한다 (AI 코멘트 포함).
     */
    public static DiaryResponse of(Diary diary, AiCommentResponse aiComment) {
        return DiaryResponse.builder()
                .id(diary.getId())
                .title(diary.getTitle())
                .content(diary.getContent())
                .diaryDate(diary.getDiaryDate())
                .diaryType(diary.getDiaryType())
                .theme(diary.getTheme())
                .aiComment(aiComment)
                .createdAt(diary.getCreatedAt())
                .updatedAt(diary.getUpdatedAt())
                .build();
    }

    /**
     * 엔티티를 DTO로 변환한다 (AI 코멘트 + 레벨업 정보 포함).
     */
    public static DiaryResponse of(Diary diary, AiCommentResponse aiComment, LevelUpInfo levelUpInfo) {
        return DiaryResponse.builder()
                .id(diary.getId())
                .title(diary.getTitle())
                .content(diary.getContent())
                .diaryDate(diary.getDiaryDate())
                .diaryType(diary.getDiaryType())
                .theme(diary.getTheme())
                .aiComment(aiComment)
                .levelUp(levelUpInfo)
                .createdAt(diary.getCreatedAt())
                .updatedAt(diary.getUpdatedAt())
                .build();
    }

    /**
     * 엔티티를 DTO로 변환한다 (AI 코멘트 + 레벨업 + 스트릭 정보 포함).
     */
    public static DiaryResponse of(Diary diary, AiCommentResponse aiComment,
                                   LevelUpInfo levelUpInfo, StreakInfo streakInfo) {
        return DiaryResponse.builder()
                .id(diary.getId())
                .title(diary.getTitle())
                .content(diary.getContent())
                .diaryDate(diary.getDiaryDate())
                .diaryType(diary.getDiaryType())
                .theme(diary.getTheme())
                .aiComment(aiComment)
                .levelUp(levelUpInfo)
                .streak(streakInfo)
                .createdAt(diary.getCreatedAt())
                .updatedAt(diary.getUpdatedAt())
                .build();
    }
}
