package com.github.mamuriapp.ai.service;

import com.github.mamuriapp.ai.dto.AiCommentResponse;
import com.github.mamuriapp.ai.entity.AiComment;
import com.github.mamuriapp.ai.repository.AiCommentRepository;
import com.github.mamuriapp.diary.entity.Diary;
import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * AI 코멘트 서비스.
 * 일기에 대한 AI 공감 코멘트를 생성하고 관리한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiCommentService {

    private final AiCommentRepository aiCommentRepository;
    private final SafetyCheckService safetyCheckService;

    /**
     * 일기에 대한 AI 코멘트를 생성한다.
     * 안전 검사를 먼저 수행하고, 위기 신호 시 안전 메시지로 대체한다.
     *
     * @param diary 코멘트를 생성할 일기
     * @return AI 코멘트 응답
     */
    @Transactional
    public AiCommentResponse generateComment(Diary diary) {
        boolean isSafe = safetyCheckService.check(diary);

        String content;
        if (!isSafe) {
            content = "힘든 시간을 보내고 계시는군요. "
                    + "혼자 감당하지 않아도 괜찮아요. "
                    + "전문적인 도움을 받을 수 있는 곳에 연락해 보시는 건 어떨까요?";
        } else {
            content = callExternalAi(diary);
        }

        AiComment aiComment = AiComment.builder()
                .diary(diary)
                .content(content)
                .build();
        aiCommentRepository.save(aiComment);

        return AiCommentResponse.from(aiComment);
    }

    /**
     * 일기 ID로 AI 코멘트를 조회한다.
     *
     * @param diaryId 일기 ID
     * @return AI 코멘트 응답 (없으면 null)
     */
    @Transactional(readOnly = true)
    public AiCommentResponse getComment(Long diaryId) {
        return aiCommentRepository.findByDiaryId(diaryId)
                .map(AiCommentResponse::from)
                .orElse(null);
    }

    /**
     * AI 코멘트를 재생성한다 (재시도).
     *
     * @param diaryId 일기 ID
     * @param diary   일기 엔티티
     * @return 재생성된 AI 코멘트 응답
     */
    @Transactional
    public AiCommentResponse retryComment(Long diaryId, Diary diary) {
        String content = callExternalAi(diary);

        AiComment aiComment = aiCommentRepository.findByDiaryId(diaryId)
                .map(existing -> {
                    existing.updateContent(content);
                    return existing;
                })
                .orElseGet(() -> AiComment.builder()
                        .diary(diary)
                        .content(content)
                        .build());

        aiCommentRepository.save(aiComment);
        return AiCommentResponse.from(aiComment);
    }

    /**
     * 외부 LLM API를 호출하여 공감 코멘트를 생성한다.
     * TODO: 실제 LLM API 연동 구현
     *
     * @param diary 일기 엔티티
     * @return 생성된 코멘트 텍스트
     */
    private String callExternalAi(Diary diary) {
        // TODO: 외부 LLM API 호출 구현
        // - 사용자 설정(톤)을 반영한 프롬프트 조립
        // - HTTP 클라이언트를 통한 API 호출
        // - 타임아웃 및 에러 처리
        throw new CustomException(ErrorCode.AI_SERVICE_ERROR);
    }
}
