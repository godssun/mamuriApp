package com.github.mamuriapp.user.controller;

import com.github.mamuriapp.global.dto.ApiResponse;
import com.github.mamuriapp.user.dto.DeleteAccountRequest;
import com.github.mamuriapp.user.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 계정 관리 컨트롤러.
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    /**
     * 계정을 삭제한다.
     *
     * @param authentication 인증 정보
     * @param request        삭제 요청 (비밀번호, 사유)
     * @return 성공 응답
     */
    @PostMapping("/delete-account")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            Authentication authentication,
            @Valid @RequestBody DeleteAccountRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        accountService.deleteAccount(userId, request);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
