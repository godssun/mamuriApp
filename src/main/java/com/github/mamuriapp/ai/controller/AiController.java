package com.github.mamuriapp.ai.controller;

import com.github.mamuriapp.ai.dto.AiCommentResponse;
import com.github.mamuriapp.ai.service.AiCommentService;
import com.github.mamuriapp.diary.entity.Diary;
import com.github.mamuriapp.diary.repository.DiaryRepository;
import com.github.mamuriapp.global.dto.ApiResponse;
import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * AI 컨트롤러.
 * AI 코멘트 재시도 엔드포인트를 제공한다.
 */
@RestController
@RequestMapping("/api/diaries/{diaryId}/ai-comment")
@RequiredArgsConstructor
public class AiController {

    private final AiCommentService aiCommentService;
    private final DiaryRepository diaryRepository;

    /**
     * AI 코멘트를 재생성한다 (재시도).
     * AI 코멘트 생성에 실패했거나 다시 생성하고 싶을 때 사용한다.
     *
     * @param authentication 인증 정보
     * @param diaryId        일기 ID
     * @return 재생성된 AI 코멘트 응답
     */
    @PostMapping("/retry")
    public ResponseEntity<ApiResponse<AiCommentResponse>> retryComment(
            Authentication authentication,
            @PathVariable Long diaryId) {
        Long userId = (Long) authentication.getPrincipal();

        Diary diary = diaryRepository.findByIdAndUserIdWithUser(diaryId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.DIARY_NOT_FOUND));

        AiCommentResponse response = aiCommentService.retryComment(diaryId, diary, diary.getUser().getNickname());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
