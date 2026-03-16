package com.github.mamuriapp.diary.controller;

import com.github.mamuriapp.diary.dto.ConversationHistoryResponse;
import com.github.mamuriapp.diary.dto.ConversationReplyRequest;
import com.github.mamuriapp.diary.dto.ConversationReplyResponse;
import com.github.mamuriapp.diary.service.ConversationService;
import com.github.mamuriapp.global.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 대화 컨트롤러.
 * 일기에 대한 다회차 AI 대화 엔드포인트를 제공한다.
 */
@RestController
@RequestMapping("/api/diaries/{diaryId}/conversation")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    /**
     * 대화 답장을 전송한다.
     *
     * @param authentication 인증 정보
     * @param diaryId        일기 ID
     * @param request        답장 요청
     * @return 답장 응답 (사용자 메시지 + AI 응답 + 남은 횟수)
     */
    @PostMapping("/reply")
    public ResponseEntity<ApiResponse<ConversationReplyResponse>> sendReply(
            Authentication authentication,
            @PathVariable Long diaryId,
            @Valid @RequestBody ConversationReplyRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        ConversationReplyResponse response = conversationService.sendReply(
                diaryId, userId, request.getContent());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 대화 이력을 조회한다.
     *
     * @param authentication 인증 정보
     * @param diaryId        일기 ID
     * @return 대화 이력 (메시지 목록 + 제한 정보)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<ConversationHistoryResponse>> getConversation(
            Authentication authentication,
            @PathVariable Long diaryId) {
        Long userId = (Long) authentication.getPrincipal();
        ConversationHistoryResponse response = conversationService.getConversation(diaryId, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
