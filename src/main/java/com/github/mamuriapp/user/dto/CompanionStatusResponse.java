package com.github.mamuriapp.user.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * 동반자 상태 응답 DTO.
 */
@Getter
@Builder
public class CompanionStatusResponse {

    private final String aiName;
    private final int relationshipStage;
    private final String stageDescription;
    private final long diaryCount;
    private final int currentStreak;
    private final String companionMood;
    private final int memoryCount;
}
