package com.github.mamuriapp.ai.controller;

import com.github.mamuriapp.ai.entity.ReflectionReport;
import com.github.mamuriapp.ai.service.ReflectionReportService;
import com.github.mamuriapp.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 리플렉션 리포트 API 컨트롤러.
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReflectionReportService reportService;

    @GetMapping
    public ApiResponse<List<ReportResponse>> getReports(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        List<ReportResponse> reports = reportService.getReports(userId).stream()
                .map(ReportResponse::from)
                .toList();
        return ApiResponse.success(reports);
    }

    @GetMapping("/{reportId}")
    public ApiResponse<ReportResponse> getReport(@PathVariable Long reportId, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.success(ReportResponse.from(reportService.getReport(reportId, userId)));
    }

    @PostMapping("/generate")
    public ApiResponse<ReportResponse> generateWeekly(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        ReflectionReport report = reportService.generateManualWeekly(userId);
        if (report == null) {
            return ApiResponse.fail("리포트 생성에 필요한 일기가 부족합니다 (최소 3일).");
        }
        return ApiResponse.success(ReportResponse.from(report));
    }

    record ReportResponse(
            Long id, String reportType, String periodStart, String periodEnd,
            String title, String content, String growthInsight,
            List<String> keyEvents, int diaryCount, String status, String createdAt
    ) {
        static ReportResponse from(ReflectionReport r) {
            return new ReportResponse(
                    r.getId(), r.getReportType(),
                    r.getPeriodStart().toString(), r.getPeriodEnd().toString(),
                    r.getTitle(), r.getContent(), r.getGrowthInsight(),
                    r.getKeyEvents(), r.getDiaryCount(), r.getStatus(),
                    r.getCreatedAt() != null ? r.getCreatedAt().toString() : null
            );
        }
    }
}
