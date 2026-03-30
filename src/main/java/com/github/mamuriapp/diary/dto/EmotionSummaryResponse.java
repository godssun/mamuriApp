package com.github.mamuriapp.diary.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

/**
 * 감정 요약 응답 DTO (주간/월간).
 */
@Getter
@Builder
public class EmotionSummaryResponse {

    private final Map<String, Long> emotionDistribution;
    private final String dominantEmotion;
    private final int totalEntries;
    private final double averageScore;
    private final List<EmotionCalendarEntry> calendar;

    @Getter
    @Builder
    public static class EmotionCalendarEntry {
        private final String date;
        private final String emotion;
        private final int score;
    }
}
