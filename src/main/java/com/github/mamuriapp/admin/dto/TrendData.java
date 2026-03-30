package com.github.mamuriapp.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 일별 트렌드 데이터 응답.
 */
@Getter
@Builder
public class TrendData {

    private final List<String> labels;
    private final List<Long> values;
    private final String metric;
}
