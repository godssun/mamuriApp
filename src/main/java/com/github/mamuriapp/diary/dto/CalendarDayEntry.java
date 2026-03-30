package com.github.mamuriapp.diary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

/**
 * 캘린더 일별 엔트리 DTO (스티커 포함).
 */
@Getter
@AllArgsConstructor
@Builder
public class CalendarDayEntry {

    private LocalDate date;
    private Long diaryId;
    private String primaryEmotion;
    private int emotionScore;
    private Long primaryStickerId;
    private String stickerCode;
    private String stickerImageUrl;
    private String categoryColorHex;
}
