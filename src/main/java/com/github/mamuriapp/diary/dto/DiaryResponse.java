package com.github.mamuriapp.diary.dto;

import com.github.mamuriapp.ai.dto.AiCommentResponse;
import com.github.mamuriapp.diary.entity.Diary;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 일기 응답 DTO.
 */
@Getter
@AllArgsConstructor
public class DiaryResponse {

    private Long id;
    private String title;
    private String content;
    private LocalDate diaryDate;
    private AiCommentResponse aiComment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * 엔티티를 DTO로 변환한다 (AI 코멘트 없이).
     *
     * @param diary 일기 엔티티
     * @return DiaryResponse
     */
    public static DiaryResponse from(Diary diary) {
        return new DiaryResponse(
                diary.getId(),
                diary.getTitle(),
                diary.getContent(),
                diary.getDiaryDate(),
                null,
                diary.getCreatedAt(),
                diary.getUpdatedAt()
        );
    }

    /**
     * 엔티티를 DTO로 변환한다 (AI 코멘트 포함).
     *
     * @param diary     일기 엔티티
     * @param aiComment AI 코멘트 응답
     * @return DiaryResponse
     */
    public static DiaryResponse of(Diary diary, AiCommentResponse aiComment) {
        return new DiaryResponse(
                diary.getId(),
                diary.getTitle(),
                diary.getContent(),
                diary.getDiaryDate(),
                aiComment,
                diary.getCreatedAt(),
                diary.getUpdatedAt()
        );
    }
}
