package com.github.mamuriapp.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

/**
 * 스트릭 응답 DTO.
 */
@Getter
@AllArgsConstructor
public class StreakResponse {

    private int currentStreak;
    private int longestStreak;
    private LocalDate lastDiaryDate;
}
