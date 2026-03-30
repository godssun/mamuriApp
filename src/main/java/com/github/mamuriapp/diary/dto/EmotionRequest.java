package com.github.mamuriapp.diary.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

import java.util.List;

/**
 * 감정 기록 요청 DTO.
 */
@Getter
public class EmotionRequest {

    @NotBlank
    private String primaryEmotion;

    private List<String> secondaryEmotions;

    @Min(1) @Max(5)
    private int emotionScore = 3;
}
