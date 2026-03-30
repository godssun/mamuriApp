package com.github.mamuriapp.admin.controller;

import com.github.mamuriapp.admin.dto.AdminUserDetail;
import com.github.mamuriapp.admin.dto.AdminUserSummary;
import com.github.mamuriapp.admin.service.AdminAuditService;
import com.github.mamuriapp.admin.service.AdminUserService;
import com.github.mamuriapp.global.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

/**
 * Admin 사용자 관리 API 컨트롤러.
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService userService;
    private final AdminAuditService auditService;

    @GetMapping
    public ApiResponse<Page<AdminUserSummary>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tier,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            HttpServletRequest request) {
        auditService.log(request, "LIST_USERS", "USER", null,
                "keyword=" + keyword + " tier=" + tier + " status=" + status);
        return ApiResponse.success(
                userService.getUsers(keyword, tier, status, page, Math.min(size, 100), sortBy, sortDir));
    }

    @GetMapping("/{userId}")
    public ApiResponse<AdminUserDetail> getUserDetail(@PathVariable Long userId,
                                                       HttpServletRequest request) {
        auditService.log(request, "VIEW_USER_DETAIL", "USER", String.valueOf(userId), null);
        return ApiResponse.success(userService.getUserDetail(userId));
    }
}
