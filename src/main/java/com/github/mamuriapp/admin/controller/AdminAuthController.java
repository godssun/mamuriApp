package com.github.mamuriapp.admin.controller;

import com.github.mamuriapp.admin.dto.AdminLoginRequest;
import com.github.mamuriapp.admin.dto.AdminLoginResponse;
import com.github.mamuriapp.admin.dto.AdminMeResponse;
import com.github.mamuriapp.admin.service.AdminAuthService;
import com.github.mamuriapp.global.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * Admin 인증 API 컨트롤러.
 */
@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    @PostMapping("/login")
    public ApiResponse<AdminLoginResponse> login(@Valid @RequestBody AdminLoginRequest request) {
        return ApiResponse.success(adminAuthService.login(request));
    }

    @GetMapping("/me")
    public ApiResponse<AdminMeResponse> me(HttpServletRequest request) {
        Long adminId = (Long) request.getAttribute("adminId");
        return ApiResponse.success(adminAuthService.getMe(adminId));
    }
}
