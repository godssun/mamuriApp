package com.github.mamuriapp.diary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.Getter;

import java.time.LocalDate;

/**
 * 일기 작성 요청 DTO.
 */
@Getter
public class DiaryCreateRequest {

    @NotBlank(message = "제목은 필수입니다.")
    @Size(max = 100, message = "제목은 100자 이하여야 합니다.")
    private String title;

    @NotBlank(message = "내용은 필수입니다.")
    private String content;

    /**
     * 일기 날짜. 미입력 시 오늘 날짜로 설정됨.
     * 미래 날짜는 허용되지 않음.
     */
    @PastOrPresent(message = "일기 날짜는 오늘 이전이어야 합니다.")
    private LocalDate diaryDate;
}
