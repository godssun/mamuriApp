package com.github.mamuriapp.ai.service;

import com.github.mamuriapp.ai.config.AiProperties;
import com.github.mamuriapp.ai.dto.AiCommentResponse;
import com.github.mamuriapp.ai.entity.AiComment;
import com.github.mamuriapp.ai.provider.LlmProvider;
import com.github.mamuriapp.ai.provider.LlmResponse;
import com.github.mamuriapp.ai.repository.AiCommentRepository;
import com.github.mamuriapp.diary.entity.Diary;
import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

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
    private final LlmProvider llmProvider;
    private final AiProperties aiProperties;

    private String promptTemplate;

    @PostConstruct
    void loadPromptTemplate() {
        String path = "prompts/ai_comment_" + aiProperties.getPromptVersion() + ".txt";
        try {
            promptTemplate = new ClassPathResource(path)
                    .getContentAsString(StandardCharsets.UTF_8);
            log.info("프롬프트 템플릿 로드 완료: {}", path);
        } catch (IOException e) {
            throw new IllegalStateException("프롬프트 템플릿을 찾을 수 없습니다: " + path, e);
        }
    }

    /**
     * 일기에 대한 AI 코멘트를 생성한다.
     * 안전 검사를 먼저 수행하고, 위기 신호 시 안전 메시지로 대체한다.
     *
     * @param diary    코멘트를 생성할 일기
     * @param userName 사용자 닉네임 (프롬프트 개인화용)
     * @return AI 코멘트 응답
     */
    @Transactional
    public AiCommentResponse generateComment(Diary diary, String userName) {
        boolean isSafe = safetyCheckService.check(diary);

        String content;
        String modelName;

        if (!isSafe) {
            content = "힘든 시간을 보내고 계시는군요. "
                    + "혼자 감당하지 않아도 괜찮아요. "
                    + "전문적인 도움을 받을 수 있는 곳에 연락해 보시는 건 어떨까요? "
                    + "(자살예방상담전화 1393, 정신건강위기상담전화 1577-0199)";
            modelName = "safety-override";
        } else {
            LlmResponse response = callLlm(diary, userName);
            content = response.content();
            modelName = response.modelName();
        }

        AiComment aiComment = AiComment.builder()
                .diary(diary)
                .content(content)
                .modelName(modelName)
                .promptVersion(aiProperties.getPromptVersion())
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
     * @param diaryId  일기 ID
     * @param diary    일기 엔티티
     * @param userName 사용자 닉네임
     * @return 재생성된 AI 코멘트 응답
     */
    @Transactional
    public AiCommentResponse retryComment(Long diaryId, Diary diary, String userName) {
        LlmResponse response = callLlm(diary, userName);

        AiComment aiComment = aiCommentRepository.findByDiaryId(diaryId)
                .map(existing -> {
                    existing.updateContent(response.content());
                    return existing;
                })
                .orElseGet(() -> AiComment.builder()
                        .diary(diary)
                        .content(response.content())
                        .modelName(response.modelName())
                        .promptVersion(aiProperties.getPromptVersion())
                        .build());

        aiCommentRepository.save(aiComment);
        return AiCommentResponse.from(aiComment);
    }

    private LlmResponse callLlm(Diary diary, String userName) {
        String diaryContent = truncate(diary.getContent(), aiProperties.getMaxInputChars());
        String prompt = promptTemplate
                .replace("{{userName}}", userName != null ? userName : "친구")
                .replace("{{content}}", diaryContent);
        return llmProvider.generate(prompt, aiProperties.getMaxOutputTokens());
    }

    private String truncate(String text, int maxChars) {
        if (text == null || text.length() <= maxChars) {
            return text;
        }
        return text.substring(0, maxChars);
    }
}
