package com.github.mamuriapp.diary.controller;

import com.github.mamuriapp.diary.dto.DecorationAssetResponse;
import com.github.mamuriapp.diary.dto.DecorationPlacementRequest;
import com.github.mamuriapp.diary.dto.DiaryDecorationResponse;
import com.github.mamuriapp.diary.service.DecorationService;
import com.github.mamuriapp.global.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 꾸미기 API.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DecorationController {

    private final DecorationService decorationService;

    /**
     * 전체 꾸미기 에셋을 조회한다.
     */
    @GetMapping("/decorations/assets")
    public ApiResponse<List<DecorationAssetResponse>> getAssets(
            @RequestParam(required = false) String category) {
        if (category != null) {
            return ApiResponse.success(decorationService.getAssetsByCategory(category));
        }
        return ApiResponse.success(decorationService.getAssets());
    }

    /**
     * 일기의 꾸미기 배치를 조회한다.
     */
    @GetMapping("/diaries/{diaryId}/decorations")
    public ApiResponse<List<DiaryDecorationResponse>> getDecorations(@PathVariable Long diaryId) {
        return ApiResponse.success(decorationService.getDecorations(diaryId));
    }

    /**
     * 일기의 꾸미기를 저장한다 (전체 교체).
     */
    @PutMapping("/diaries/{diaryId}/decorations")
    public ApiResponse<List<DiaryDecorationResponse>> saveDecorations(
            @PathVariable Long diaryId,
            @Valid @RequestBody DecorationPlacementRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(decorationService.saveDecorations(diaryId, userId, request));
    }
}
