package com.github.mamuriapp.user.controller;

import com.github.mamuriapp.global.dto.ApiResponse;
import com.github.mamuriapp.user.dto.UserSettingsDto;
import com.github.mamuriapp.user.service.UserSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 사용자 설정 컨트롤러.
 */
@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class UserSettingsController {

    private final UserSettingsService userSettingsService;

    /**
     * 현재 사용자의 설정을 조회한다.
     *
     * @param authentication 인증 정보
     * @return 사용자 설정
     */
    @GetMapping
    public ResponseEntity<ApiResponse<UserSettingsDto>> getSettings(
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(
                ApiResponse.success(userSettingsService.getSettings(userId)));
    }

    /**
     * 현재 사용자의 설정을 변경한다.
     *
     * @param authentication 인증 정보
     * @param request        설정 변경 요청
     * @return 변경된 사용자 설정
     */
    @PutMapping
    public ResponseEntity<ApiResponse<UserSettingsDto>> updateSettings(
            Authentication authentication,
            @Valid @RequestBody UserSettingsDto request) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(
                ApiResponse.success(userSettingsService.updateSettings(userId, request)));
    }
}
