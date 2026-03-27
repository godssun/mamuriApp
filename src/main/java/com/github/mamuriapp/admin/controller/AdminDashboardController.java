package com.github.mamuriapp.admin.controller;

import com.github.mamuriapp.admin.dto.*;
import com.github.mamuriapp.admin.service.AdminAuditService;
import com.github.mamuriapp.admin.service.AdminDashboardService;
import com.github.mamuriapp.global.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

/**
 * Admin 대시보드 API 컨트롤러.
 * 모든 엔드포인트는 AdminApiKeyFilter에 의해 보호된다.
 */
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;
    private final AdminAuditService auditService;

    @GetMapping("/overview")
    public ApiResponse<DashboardOverview> getOverview(HttpServletRequest request) {
        auditService.log(request, "VIEW_OVERVIEW", null, null, null);
        return ApiResponse.success(dashboardService.getOverview());
    }

    @GetMapping("/signups")
    public ApiResponse<TrendData> getSignupTrend(@RequestParam(defaultValue = "30") int days,
                                                  HttpServletRequest request) {
        auditService.log(request, "VIEW_SIGNUPS", null, null, "days=" + days);
        return ApiResponse.success(dashboardService.getSignupTrend(Math.min(days, 90)));
    }

    @GetMapping("/dau")
    public ApiResponse<TrendData> getDauTrend(@RequestParam(defaultValue = "30") int days,
                                               HttpServletRequest request) {
        auditService.log(request, "VIEW_DAU", null, null, "days=" + days);
        return ApiResponse.success(dashboardService.getDauTrend(Math.min(days, 90)));
    }

    @GetMapping("/ai-usage")
    public ApiResponse<AiUsageTrend> getAiUsageTrend(@RequestParam(defaultValue = "30") int days,
                                                      HttpServletRequest request) {
        auditService.log(request, "VIEW_AI_USAGE", null, null, "days=" + days);
        return ApiResponse.success(dashboardService.getAiUsageTrend(Math.min(days, 90)));
    }

    @GetMapping("/retention")
    public ApiResponse<RetentionData> getRetention(@RequestParam(defaultValue = "8") int weeks,
                                                    HttpServletRequest request) {
        auditService.log(request, "VIEW_RETENTION", null, null, "weeks=" + weeks);
        return ApiResponse.success(dashboardService.getRetention(Math.min(weeks, 12)));
    }

    @GetMapping("/churn")
    public ApiResponse<ChurnAnalysis> getChurnAnalysis(HttpServletRequest request) {
        auditService.log(request, "VIEW_CHURN", null, null, null);
        return ApiResponse.success(dashboardService.getChurnAnalysis());
    }

    @GetMapping("/audit-logs")
    public ApiResponse<Page<AdminAuditLogResponse>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            HttpServletRequest request) {
        return ApiResponse.success(
                auditService.getAuditLogs(page, size).map(AdminAuditLogResponse::from));
    }
}
