package com.github.mamuriapp.diary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

import java.time.LocalDate;

/**
 * 일기 수정 요청 DTO.
 */
@Getter
public class DiaryUpdateRequest {

    @NotBlank(message = "제목은 필수입니다.")
    @Size(max = 100, message = "제목은 100자 이하여야 합니다.")
    private String title;

    @NotBlank(message = "내용은 필수입니다.")
    @Size(max = 10000, message = "일기 내용은 10,000자 이하여야 합니다.")
    private String content;

    /**
     * 일기 날짜. 미입력 시 기존 날짜 유지.
     * 미래 날짜 검증은 DiaryService에서 KST 기준으로 수행.
     */
    private LocalDate diaryDate;
}
