package com.github.mamuriapp.diary.controller;

import com.github.mamuriapp.diary.dto.DiaryCreateRequest;
import com.github.mamuriapp.diary.dto.DiaryResponse;
import com.github.mamuriapp.diary.dto.DiaryUpdateRequest;
import com.github.mamuriapp.diary.service.DiaryService;
import com.github.mamuriapp.global.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 일기 컨트롤러.
 * 일기 CRUD 엔드포인트를 제공한다.
 */
@RestController
@RequestMapping("/api/diaries")
@RequiredArgsConstructor
public class DiaryController {

    private final DiaryService diaryService;

    /**
     * 새로운 일기를 작성한다.
     *
     * @param authentication 인증 정보
     * @param request        일기 작성 요청
     * @return 작성된 일기 응답
     */
    @PostMapping
    public ResponseEntity<ApiResponse<DiaryResponse>> create(
            Authentication authentication,
            @Valid @RequestBody DiaryCreateRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        DiaryResponse response = diaryService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    /**
     * 일기 목록을 조회한다.
     *
     * @param authentication 인증 정보
     * @return 일기 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DiaryResponse>>> getList(
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(diaryService.getList(userId)));
    }

    /**
     * 일기 상세를 조회한다.
     *
     * @param authentication 인증 정보
     * @param diaryId        일기 ID
     * @return 일기 상세 응답
     */
    @GetMapping("/{diaryId}")
    public ResponseEntity<ApiResponse<DiaryResponse>> getDetail(
            Authentication authentication,
            @PathVariable Long diaryId) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(
                ApiResponse.success(diaryService.getDetail(userId, diaryId)));
    }

    /**
     * 일기를 수정한다.
     *
     * @param authentication 인증 정보
     * @param diaryId        일기 ID
     * @param request        일기 수정 요청
     * @return 수정된 일기 응답
     */
    @PutMapping("/{diaryId}")
    public ResponseEntity<ApiResponse<DiaryResponse>> update(
            Authentication authentication,
            @PathVariable Long diaryId,
            @Valid @RequestBody DiaryUpdateRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(
                ApiResponse.success(diaryService.update(userId, diaryId, request)));
    }

    /**
     * 일기를 삭제한다.
     *
     * @param authentication 인증 정보
     * @param diaryId        일기 ID
     * @return 성공 응답
     */
    @DeleteMapping("/{diaryId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            Authentication authentication,
            @PathVariable Long diaryId) {
        Long userId = (Long) authentication.getPrincipal();
        diaryService.delete(userId, diaryId);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
