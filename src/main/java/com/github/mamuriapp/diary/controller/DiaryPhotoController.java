package com.github.mamuriapp.diary.controller;

import com.github.mamuriapp.diary.dto.DiaryPhotoResponse;
import com.github.mamuriapp.diary.dto.PhotoPositionRequest;
import com.github.mamuriapp.diary.service.DiaryPhotoService;
import com.github.mamuriapp.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 일기 사진 API.
 */
@RestController
@RequestMapping("/api/diaries/{diaryId}/photos")
@RequiredArgsConstructor
public class DiaryPhotoController {

    private final DiaryPhotoService photoService;

    /**
     * 일기에 사진을 업로드한다.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<DiaryPhotoResponse>> upload(
            @PathVariable Long diaryId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        DiaryPhotoResponse response = photoService.upload(diaryId, userId, file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    /**
     * 일기의 사진 목록을 조회한다.
     */
    @GetMapping
    public ApiResponse<List<DiaryPhotoResponse>> getPhotos(@PathVariable Long diaryId) {
        return ApiResponse.success(photoService.getPhotos(diaryId));
    }

    /**
     * 사진의 캔버스 좌표를 업데이트한다.
     */
    @PutMapping("/{photoId}/position")
    public ApiResponse<DiaryPhotoResponse> updatePosition(
            @PathVariable Long diaryId,
            @PathVariable Long photoId,
            @RequestBody PhotoPositionRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        DiaryPhotoResponse response = photoService.updatePosition(
                diaryId, photoId, userId,
                request.getPositionX(), request.getPositionY(),
                request.getDisplayWidth(), request.getDisplayHeight(),
                request.getZIndex());
        return ApiResponse.success(response);
    }

    /**
     * 사진을 삭제한다.
     */
    @DeleteMapping("/{photoId}")
    public ApiResponse<Void> delete(
            @PathVariable Long diaryId,
            @PathVariable Long photoId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        photoService.delete(photoId, userId);
        return ApiResponse.success();
    }
}
