package com.github.mamuriapp.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * AI 친구 프로필 응답 DTO.
 */
@Getter
@AllArgsConstructor
public class CompanionResponse {

    private String aiName;
    private int level;
    private long diaryCount;
    private long nextLevelDiaryCount;
    private boolean maxLevel;
}
