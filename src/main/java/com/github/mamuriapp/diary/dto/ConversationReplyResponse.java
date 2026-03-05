package com.github.mamuriapp.diary.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 대화 답장 응답 DTO.
 */
@Getter
@Builder
public class ConversationReplyResponse {

    private Long userMessageId;
    private Long aiMessageId;
    private String aiResponse;
    /** 남은 답변 횟수 (null = 무제한) */
    private Integer remainingReplies;
    private LocalDateTime createdAt;
}
