package com.github.mamuriapp.ai.dto;

import com.github.mamuriapp.ai.entity.AiComment;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * AI 코멘트 응답 DTO.
 */
@Getter
@AllArgsConstructor
public class AiCommentResponse {

    private Long id;
    private String content;
    private LocalDateTime createdAt;

    /**
     * 엔티티를 DTO로 변환한다.
     *
     * @param entity AiComment 엔티티
     * @return AiCommentResponse
     */
    public static AiCommentResponse from(AiComment entity) {
        return new AiCommentResponse(
                entity.getId(),
                entity.getContent(),
                entity.getCreatedAt()
        );
    }
}
