package com.github.mamuriapp.user.controller;

import com.github.mamuriapp.global.dto.ApiResponse;
import com.github.mamuriapp.user.service.PushNotificationService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 푸시 토큰 등록/해제 API 컨트롤러.
 */
@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushTokenController {

    private final PushNotificationService pushService;

    @PostMapping("/register")
    public ApiResponse<Void> register(@RequestBody TokenRequest request, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        pushService.registerToken(userId, request.getToken(), request.getPlatform());
        return ApiResponse.success();
    }

    @PostMapping("/unregister")
    public ApiResponse<Void> unregister(@RequestBody TokenRequest request, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        pushService.unregisterToken(userId, request.getToken());
        return ApiResponse.success();
    }

    @Getter
    static class TokenRequest {
        private String token;
        private String platform;
    }
}
