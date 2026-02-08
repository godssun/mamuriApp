package com.github.mamuriapp.diary.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

/**
 * 캘린더용 일기 날짜 목록 응답 DTO.
 */
@Getter
@AllArgsConstructor
public class DiaryCalendarResponse {

    /**
     * 조회 연도.
     */
    private int year;

    /**
     * 조회 월.
     */
    private int month;

    /**
     * 일기가 존재하는 날짜 목록.
     */
    private List<LocalDate> datesWithDiaries;

    public static DiaryCalendarResponse of(int year, int month, List<LocalDate> dates) {
        return new DiaryCalendarResponse(year, month, dates);
    }
}
