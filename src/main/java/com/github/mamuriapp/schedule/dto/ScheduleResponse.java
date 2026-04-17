package com.github.mamuriapp.schedule.dto;

import com.github.mamuriapp.schedule.entity.Schedule;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class ScheduleResponse {

    private final Long id;
    private final String title;
    private final LocalDateTime startAt;
    private final LocalDateTime endAt;
    private final String note;
    private final boolean isAllDay;
    private final Long linkedDiaryId;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final String color;
    private final boolean completed;

    public static ScheduleResponse from(Schedule schedule) {
        return ScheduleResponse.builder()
                .id(schedule.getId())
                .title(schedule.getTitle())
                .startAt(schedule.getStartAt())
                .endAt(schedule.getEndAt())
                .note(schedule.getNote())
                .isAllDay(schedule.isAllDay())
                .linkedDiaryId(schedule.getLinkedDiaryId())
                .createdAt(schedule.getCreatedAt())
                .updatedAt(schedule.getUpdatedAt())
                .color(schedule.getColor())
                .completed(schedule.isCompleted())
                .build();
    }
}
