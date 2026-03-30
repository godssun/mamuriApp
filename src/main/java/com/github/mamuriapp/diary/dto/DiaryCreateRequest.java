package com.github.mamuriapp.diary.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

/**
 * 일기 작성 요청 DTO.
 * 스티커 감정 기록 도입으로 title/content는 선택으로 변경.
 */
@Getter
public class DiaryCreateRequest {

    @Size(max = 100, message = "제목은 100자 이하여야 합니다.")
    private String title;

    @Size(max = 10000, message = "일기 내용은 10,000자 이하여야 합니다.")
    private String content;

    /**
     * 일기 날짜. 미입력 시 오늘(KST) 날짜로 설정됨.
     * 미래 날짜 검증은 DiaryService에서 KST 기준으로 수행.
     */
    private LocalDate diaryDate;

    /** 감정 (선택). 설정 시 diary_emotions에 자동 저장. */
    private String primaryEmotion;

    /** 세부 감정 태그 (선택). */
    private List<String> secondaryEmotions;

    /** 감정 강도 1-5 (선택, 기본값 3). */
    private Integer emotionScore;

    /** 스티커 ID로 감정 선택 (선택). */
    private Long primaryStickerId;

    /** 보조 스티커 ID 목록 (선택). */
    private List<Long> secondaryStickerIds;

    /** 일기 타입: TEXT, STICKER_ONLY, PHOTO (기본값 TEXT). */
    private String diaryType;

    /** 테마 (선택). */
    private String theme;
}
