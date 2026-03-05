package com.github.mamuriapp.diary.dto;

import com.github.mamuriapp.diary.entity.ConversationMessage;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 대화 이력 응답 DTO.
 */
@Getter
@Builder
public class ConversationHistoryResponse {

    private Long diaryId;
    private List<MessageDto> messages;
    private LimitsDto limits;

    /**
     * 개별 메시지 DTO.
     */
    @Getter
    @Builder
    public static class MessageDto {
        private Long id;
        private String role;
        private String content;
        private int sequenceNumber;
        private LocalDateTime createdAt;

        public static MessageDto from(ConversationMessage entity) {
            return MessageDto.builder()
                    .id(entity.getId())
                    .role(entity.getRole())
                    .content(entity.getContent())
                    .sequenceNumber(entity.getSequenceNumber())
                    .createdAt(entity.getCreatedAt())
                    .build();
        }
    }

    /**
     * 답변 제한 정보 DTO (일별 기준).
     */
    @Getter
    @Builder
    public static class LimitsDto {
        /** 하루 최대 답변 횟수 (-1 = 무제한, 0 = 차단) */
        private int maxRepliesPerDay;
        /** 오늘 사용한 답변 횟수 */
        private int usedRepliesToday;
        /** 남은 답변 횟수 (null = 무제한) */
        private Integer remainingReplies;
        /** 현재 유효 티어 */
        private String tier;
        /** 체험 기간 활성 여부 */
        private boolean trialActive;
    }
}
