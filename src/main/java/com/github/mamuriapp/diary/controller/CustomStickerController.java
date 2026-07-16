package com.github.mamuriapp.diary.controller;

import com.github.mamuriapp.diary.dto.CustomStickerResponse;
import com.github.mamuriapp.diary.service.CustomStickerService;
import com.github.mamuriapp.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 커스텀 스티커 API.
 *
 * 생성(POST)은 프리미엄 구독자만 가능하며, 조회/삭제는 인증된 사용자면 구독 상태와 무관하게 허용한다.
 * 주의: 이 경로(/api/stickers/custom/**)는 SecurityConfig에서 명시적으로 인증 필수로 지정되어 있다
 * (기본 스티커 카탈로그 /api/stickers/** 는 permitAll 이므로 순서상 먼저 매칭되어야 한다).
 */
@RestController
@RequestMapping("/api/stickers/custom")
@RequiredArgsConstructor
public class CustomStickerController {

    private final CustomStickerService stickerService;

    /**
     * 커스텀 스티커를 업로드한다. (프리미엄 전용)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CustomStickerResponse>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "width", required = false) Integer width,
            @RequestParam(value = "height", required = false) Integer height,
            @RequestParam(value = "borderStyle", required = false) String borderStyle,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        CustomStickerResponse response = stickerService.upload(userId, file, width, height, borderStyle);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    /**
     * 내 커스텀 스티커 목록을 조회한다.
     */
    @GetMapping
    public ApiResponse<List<CustomStickerResponse>> getMyStickers(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(stickerService.getMyStickers(userId));
    }

    /**
     * 커스텀 스티커를 삭제한다. (본인 소유만)
     */
    @DeleteMapping("/{stickerId}")
    public ApiResponse<Void> delete(
            @PathVariable Long stickerId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        stickerService.delete(stickerId, userId);
        return ApiResponse.success();
    }
}
