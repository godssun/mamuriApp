package com.github.mamuriapp.schedule.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 간단한 MVP에서는 수정 시 전체 필드를 다시 받는다(PUT-ish).
 * endAt/note/linkedDiaryId는 null이면 "해제"로 간주.
 */
@Getter
@NoArgsConstructor
public class ScheduleUpdateRequest {

    @NotBlank
    @Size(max = 100)
    private String title;

    @NotNull
    private LocalDateTime startAt;

    private LocalDateTime endAt;

    @Size(max = 2000)
    private String note;

    private Boolean isAllDay;

    private Long linkedDiaryId;
}
