package com.github.mamuriapp.user.controller;

import com.github.mamuriapp.global.dto.ApiResponse;
import com.github.mamuriapp.user.dto.CompanionResponse;
import com.github.mamuriapp.user.dto.CompanionUpdateRequest;
import com.github.mamuriapp.user.service.CompanionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * AI 친구(컴패니언) 컨트롤러.
 * AI 친구 프로필 조회 및 이름 변경 엔드포인트를 제공한다.
 */
@RestController
@RequestMapping("/api/companion")
@RequiredArgsConstructor
public class CompanionController {

    private final CompanionService companionService;

    /**
     * AI 친구 프로필을 조회한다.
     *
     * @param authentication 인증 정보
     * @return 컴패니언 프로필 응답
     */
    @GetMapping
    public ResponseEntity<ApiResponse<CompanionResponse>> getProfile(
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        CompanionResponse response = companionService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * AI 친구 이름을 변경한다.
     *
     * @param authentication 인증 정보
     * @param request        이름 변경 요청
     * @return 업데이트된 컴패니언 프로필 응답
     */
    @PutMapping
    public ResponseEntity<ApiResponse<CompanionResponse>> updateAiName(
            Authentication authentication,
            @Valid @RequestBody CompanionUpdateRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        CompanionResponse response = companionService.updateAiName(userId, request.getAiName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
