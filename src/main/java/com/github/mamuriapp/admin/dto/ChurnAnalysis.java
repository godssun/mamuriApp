package com.github.mamuriapp.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

/**
 * 이탈 분석 데이터 응답.
 */
@Getter
@Builder
public class ChurnAnalysis {

    private final long totalDeletionsThisMonth;
    private final long totalDeletionsAllTime;
    private final Map<String, Long> reasonDistribution;
}
