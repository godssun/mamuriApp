package com.github.mamuriapp.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

/**
 * AI 사용량 트렌드 응답.
 */
@Getter
@Builder
public class AiUsageTrend {

    private final List<String> labels;
    private final List<Long> callCounts;
    private final List<Long> tokenCounts;
    private final List<BigDecimal> costs;
}
