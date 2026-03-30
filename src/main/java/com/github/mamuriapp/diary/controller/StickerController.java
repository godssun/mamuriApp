package com.github.mamuriapp.diary.controller;

import com.github.mamuriapp.diary.dto.StickerCategoryResponse;
import com.github.mamuriapp.diary.service.StickerService;
import com.github.mamuriapp.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 스티커 카탈로그 API.
 */
@RestController
@RequestMapping("/api/stickers")
@RequiredArgsConstructor
public class StickerController {

    private final StickerService stickerService;

    /**
     * 전체 스티커 카탈로그를 카테고리별로 조회한다.
     */
    @GetMapping("/categories")
    public ApiResponse<List<StickerCategoryResponse>> getCategories() {
        return ApiResponse.success(stickerService.getCatalog());
    }

    /**
     * 무료 스티커 목록을 조회한다.
     */
    @GetMapping
    public ApiResponse<List<StickerCategoryResponse.StickerResponse>> getStickers() {
        return ApiResponse.success(stickerService.getFreeStickers());
    }
}
