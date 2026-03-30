package com.github.mamuriapp.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 리텐션 코호트 데이터 응답.
 */
@Getter
@Builder
public class RetentionData {

    private final List<CohortRow> cohorts;

    @Getter
    @Builder
    public static class CohortRow {
        private final String weekLabel;
        private final long cohortSize;
        private final double day1Retention;
        private final double day7Retention;
        private final double day14Retention;
        private final double day30Retention;
    }
}
