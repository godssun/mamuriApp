package com.github.mamuriapp.diary.controller;

import com.github.mamuriapp.diary.dto.EmotionRequest;
import com.github.mamuriapp.diary.dto.EmotionResponse;
import com.github.mamuriapp.diary.dto.EmotionSummaryResponse;
import com.github.mamuriapp.diary.service.EmotionService;
import com.github.mamuriapp.global.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 감정 기록 API 컨트롤러.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class EmotionController {

    private final EmotionService emotionService;

    @PostMapping("/diaries/{diaryId}/emotion")
    public ApiResponse<EmotionResponse> recordEmotion(
            @PathVariable Long diaryId,
            @Valid @RequestBody EmotionRequest request,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.success(emotionService.recordEmotion(diaryId, userId, request));
    }

    @GetMapping("/diaries/{diaryId}/emotion")
    public ApiResponse<EmotionResponse> getEmotion(@PathVariable Long diaryId) {
        return ApiResponse.success(emotionService.getEmotion(diaryId));
    }

    @GetMapping("/emotions/weekly")
    public ApiResponse<EmotionSummaryResponse> getWeeklySummary(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.success(emotionService.getWeeklySummary(userId));
    }

    @GetMapping("/emotions/monthly")
    public ApiResponse<EmotionSummaryResponse> getMonthlySummary(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.success(emotionService.getMonthlySummary(userId));
    }

    @GetMapping("/emotions/calendar")
    public ApiResponse<EmotionSummaryResponse> getCalendar(
            @RequestParam int year,
            @RequestParam int month,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.success(emotionService.getCalendar(userId, year, month));
    }
}
