package com.github.mamuriapp.user.controller;

import com.github.mamuriapp.global.dto.ApiResponse;
import com.github.mamuriapp.global.service.FileStorageService;
import com.github.mamuriapp.user.dto.CompanionResponse;
import com.github.mamuriapp.user.dto.CompanionSettingsResponse;
import com.github.mamuriapp.user.dto.CompanionSettingsUpdateRequest;
import com.github.mamuriapp.user.dto.CompanionUpdateRequest;
import com.github.mamuriapp.user.dto.StreakResponse;
import com.github.mamuriapp.ai.repository.UserMemoryRepository;
import com.github.mamuriapp.user.dto.CompanionStatusResponse;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.repository.UserRepository;
import com.github.mamuriapp.user.service.CompanionMessageService;
import com.github.mamuriapp.user.service.CompanionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * AI 친구(컴패니언) 컨트롤러.
 * AI 친구 프로필 조회 및 이름 변경 엔드포인트를 제공한다.
 */
@RestController
@RequestMapping("/api/companion")
@RequiredArgsConstructor
public class CompanionController {

    private final CompanionService companionService;
    private final CompanionMessageService companionMessageService;
    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;
    private final UserMemoryRepository userMemoryRepository;

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

    /**
     * 스트릭 정보를 조회한다.
     *
     * @param authentication 인증 정보
     * @return 스트릭 응답
     */
    @GetMapping("/streak")
    public ResponseEntity<ApiResponse<StreakResponse>> getStreak(
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        StreakResponse response = companionService.getStreak(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 컴패니언 개인화 설정을 조회한다.
     *
     * @param authentication 인증 정보
     * @return 컴패니언 설정 응답
     */
    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<CompanionSettingsResponse>> getCompanionSettings(
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        CompanionSettingsResponse response = companionService.getCompanionSettings(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 컴패니언 개인화 설정을 업데이트한다. (톤, 말투)
     *
     * @param authentication 인증 정보
     * @param request        설정 업데이트 요청
     * @return 업데이트된 컴패니언 설정 응답
     */
    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<CompanionSettingsResponse>> updateCompanionSettings(
            Authentication authentication,
            @Valid @RequestBody CompanionSettingsUpdateRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        CompanionSettingsResponse response = companionService.updateCompanionSettings(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * AI 친구 프로필 사진을 업로드한다.
     *
     * @param authentication 인증 정보
     * @param file           업로드할 이미지 파일
     * @return 업데이트된 컴패니언 설정 응답
     */
    @PostMapping("/avatar")
    public ResponseEntity<ApiResponse<CompanionSettingsResponse>> uploadAvatar(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {
        Long userId = (Long) authentication.getPrincipal();

        // 기존 아바타 파일 삭제
        CompanionSettingsResponse current = companionService.getCompanionSettings(userId);
        if (current.getAvatar() != null) {
            fileStorageService.deleteFile(current.getAvatar());
        }

        String avatarUrl = fileStorageService.storeImage(file, "avatars");
        CompanionSettingsResponse response = companionService.updateAvatar(userId, avatarUrl);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * AI 친구 프로필 사진을 삭제한다 (기본 이모지로 복귀).
     *
     * @param authentication 인증 정보
     * @return 업데이트된 컴패니언 설정 응답
     */
    @DeleteMapping("/avatar")
    public ResponseEntity<ApiResponse<CompanionSettingsResponse>> deleteAvatar(
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        String oldAvatar = companionService.removeAvatar(userId);
        if (oldAvatar != null) {
            fileStorageService.deleteFile(oldAvatar);
        }
        CompanionSettingsResponse response = companionService.getCompanionSettings(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 동반자 종합 상태를 조회한다 (관계 단계, 기억 수, 감정 등).
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<CompanionStatusResponse>> getStatus(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.ok(ApiResponse.fail("User not found"));

        String[] stageDescs = {"", "첫 만남", "알아가는 중", "친해진 사이", "깊은 신뢰", "소울메이트"};
        int stage = Math.max(1, Math.min(5, user.getRelationshipStage()));
        long memoryCount = userMemoryRepository.countByUserIdAndStatus(userId, "ACTIVE");

        CompanionMessageService.CompanionMessage msg = companionMessageService.getMessage(userId);

        return ResponseEntity.ok(ApiResponse.success(CompanionStatusResponse.builder()
                .aiName(user.getAiName() != null ? user.getAiName() : "마음이")
                .relationshipStage(stage)
                .stageDescription(stageDescs[stage])
                .diaryCount(user.getDiaryCount())
                .currentStreak(user.getCurrentStreak())
                .companionMood(msg.mood())
                .memoryCount((int) memoryCount)
                .build()));
    }

    /**
     * 동반자의 오늘 메시지를 조회한다.
     */
    @GetMapping("/message")
    public ResponseEntity<ApiResponse<CompanionMessageService.CompanionMessage>> getMessage(
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(companionMessageService.getMessage(userId)));
    }

    /**
     * 복귀 상태를 조회한다.
     */
    @GetMapping("/return-status")
    public ResponseEntity<ApiResponse<CompanionMessageService.ReturnStatus>> getReturnStatus(
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(companionMessageService.getReturnStatus(userId)));
    }
}
