package com.github.mamuriapp.user.controller;

import com.github.mamuriapp.global.dto.ApiResponse;
import com.github.mamuriapp.user.dto.*;
import com.github.mamuriapp.user.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 인증 컨트롤러.
 * 회원가입, 로그인, 토큰 갱신 엔드포인트를 제공한다.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 회원가입을 처리한다.
     *
     * @param request 회원가입 요청
     * @return 발급된 토큰 응답
     */
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<TokenResponse>> signup(
            @Valid @RequestBody SignupRequest request) {
        TokenResponse response = authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    /**
     * 로그인을 처리한다.
     *
     * @param request 로그인 요청
     * @return 발급된 토큰 응답
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(request)));
    }

    /**
     * 토큰 갱신을 처리한다.
     *
     * @param request 토큰 갱신 요청
     * @return 새로 발급된 토큰 응답
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(
            @Valid @RequestBody TokenRefreshRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.refresh(request)));
    }
}
