package com.github.mamuriapp.schedule.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class ScheduleCreateRequest {

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

    @Size(max = 20)
    private String color;
}
