package com.github.mamuriapp.diary.dto;

import com.github.mamuriapp.diary.entity.DiaryEmotion;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 감정 기록 응답 DTO.
 */
@Getter
@Builder
public class EmotionResponse {

    private final Long id;
    private final Long diaryId;
    private final String primaryEmotion;
    private final List<String> secondaryEmotions;
    private final int emotionScore;
    private final String aiDetectedEmotion;
    private final String createdAt;

    public static EmotionResponse from(DiaryEmotion e) {
        return EmotionResponse.builder()
                .id(e.getId())
                .diaryId(e.getDiary().getId())
                .primaryEmotion(e.getPrimaryEmotion())
                .secondaryEmotions(e.getSecondaryEmotions())
                .emotionScore(e.getEmotionScore())
                .aiDetectedEmotion(e.getAiDetectedEmotion())
                .createdAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null)
                .build();
    }
}
