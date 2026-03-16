package com.github.mamuriapp.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.mamuriapp.ai.config.AiProperties;
import com.github.mamuriapp.ai.dto.AiCommentResponse;
import com.github.mamuriapp.ai.entity.AiComment;
import com.github.mamuriapp.ai.entity.AiUsageLog;
import com.github.mamuriapp.ai.provider.LlmProvider;
import com.github.mamuriapp.ai.provider.LlmResponse;
import com.github.mamuriapp.ai.repository.AiCommentRepository;
import com.github.mamuriapp.ai.repository.AiUsageLogRepository;
import com.github.mamuriapp.diary.entity.ConversationMessage;
import com.github.mamuriapp.diary.entity.Diary;
import com.github.mamuriapp.diary.repository.ConversationMessageRepository;
import com.github.mamuriapp.global.config.FeatureFlags;
import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.user.entity.User;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * AI 코멘트 서비스.
 * 일기에 대한 AI 공감 코멘트를 생성하고 관리한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiCommentService {

    /** gpt-4o-mini 기준: ~$0.15/1M input + $0.60/1M output, 환율 1350원 */
    private static final BigDecimal COST_PER_TOKEN_KRW = new BigDecimal("0.0005");

    private static final List<String> FALLBACK_QUESTIONS = List.of(
            "오늘 하루 중 가장 기억에 남는 순간이 있다면 무엇인가요?",
            "요즘 마음을 편하게 해주는 것이 있나요?",
            "내일은 어떤 하루가 되었으면 좋겠나요?",
            "최근에 작은 행복을 느꼈던 순간이 있나요?",
            "오늘 자신에게 해주고 싶은 말이 있다면 무엇인가요?"
    );

    private final AiCommentRepository aiCommentRepository;
    private final AiUsageLogRepository aiUsageLogRepository;
    private final ConversationMessageRepository conversationMessageRepository;
    private final SafetyCheckService safetyCheckService;
    private final LlmProvider llmProvider;
    private final AiProperties aiProperties;
    private final PromptBuilder promptBuilder;
    private final FeatureFlags featureFlags;

    private final ObjectMapper objectMapper = new ObjectMapper();

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
     * 안전 검사 결과를 외부(DiaryService)에서 전달받아, 위기 신호 시 안전 메시지로 대체한다.
     *
     * @param diary  코멘트를 생성할 일기
     * @param user   사용자 엔티티 (개인화용)
     * @param isSafe 안전 검사 결과 (true: 안전, false: 위기 감지)
     * @return AI 코멘트 응답 (AI 비활성화 시 null)
     */
    @Transactional
    public AiCommentResponse generateComment(Diary diary, User user, boolean isSafe) {
        String comment;
        String followupQuestion = null;
        String modelName;

        if (!isSafe) {
            comment = "힘든 시간을 보내고 계시는군요. "
                    + "혼자 감당하지 않아도 괜찮아요. "
                    + "전문적인 도움을 받을 수 있는 곳에 연락해 보시는 건 어떨까요? "
                    + "(자살예방상담전화 1393, 정신건강위기상담전화 1577-0199)";
            modelName = "safety-override";
            // 위기 상황에서는 후속 질문 없음
        } else {
            try {
                LlmResponse response = callLlm(diary, user);
                if (response == null) {
                    log.info("[AI] 코멘트 비활성화 (userId={})", user.getId());
                    return null;
                }
                modelName = response.modelName();

                // JSON 파싱 시도
                String[] parsed = parseAiResponse(response.content(), diary.getId());
                comment = parsed[0];
                followupQuestion = parsed[1];

                // AI 사용량 로깅
                logAiUsage(user, diary, response);
            } catch (Exception e) {
                log.warn("[AI] LLM 호출 실패 (diaryId={}): {}", diary.getId(), e.getMessage(), e);
                return null;
            }
        }

        AiComment aiComment = AiComment.builder()
                .diary(diary)
                .content(comment)
                .followupQuestion(followupQuestion)
                .modelName(modelName)
                .promptVersion(aiProperties.getPromptVersion())
                .build();
        aiCommentRepository.save(aiComment);

        // 대화 기능 활성화 시 conversation_messages에도 저장 (dual-write)
        if (featureFlags.isConversationEnabled()) {
            saveInitialConversationMessage(diary, user, comment, modelName);
        }

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
     * @param user    사용자 엔티티
     * @return 재생성된 AI 코멘트 응답
     */
    @Transactional
    public AiCommentResponse retryComment(Long diaryId, Diary diary, User user) {
        LlmResponse response;
        try {
            response = callLlm(diary, user);
        } catch (Exception e) {
            log.warn("[AI] 재시도 LLM 호출 실패 (diaryId={}): {}", diaryId, e.getMessage());
            throw new CustomException(ErrorCode.AI_SERVICE_ERROR);
        }

        // JSON 파싱 시도
        String[] parsed = parseAiResponse(response.content(), diaryId);

        AiComment aiComment = aiCommentRepository.findByDiaryId(diaryId)
                .map(existing -> {
                    existing.updateContent(parsed[0], parsed[1]);
                    return existing;
                })
                .orElseGet(() -> AiComment.builder()
                        .diary(diary)
                        .content(parsed[0])
                        .followupQuestion(parsed[1])
                        .modelName(response.modelName())
                        .promptVersion(aiProperties.getPromptVersion())
                        .build());

        aiCommentRepository.save(aiComment);

        // 대화 기능 활성화 시 conversation_messages도 업데이트 (dual-write)
        if (featureFlags.isConversationEnabled()) {
            updateInitialConversationMessage(diary, user, parsed[0], response.modelName());
        }

        return AiCommentResponse.from(aiComment);
    }

    /**
     * 초기 AI 코멘트를 conversation_messages에 저장한다 (sequence_number=0).
     */
    private void saveInitialConversationMessage(Diary diary, User user,
                                                 String content, String modelName) {
        try {
            ConversationMessage message = ConversationMessage.builder()
                    .diary(diary)
                    .user(user)
                    .role("AI")
                    .content(content)
                    .sequenceNumber(0)
                    .modelName(modelName)
                    .promptVersion(aiProperties.getPromptVersion())
                    .build();
            conversationMessageRepository.save(message);
            log.debug("[AI] conversation_messages 초기 저장 완료 (diaryId={})", diary.getId());
        } catch (Exception e) {
            log.warn("[AI] conversation_messages 저장 실패 (diaryId={}): {}",
                    diary.getId(), e.getMessage());
        }
    }

    /**
     * conversation_messages의 초기 AI 코멘트를 업데이트한다 (재시도 시).
     * 기존 sequence_number=0 메시지가 없으면 새로 생성한다.
     */
    private void updateInitialConversationMessage(Diary diary, User user,
                                                   String content, String modelName) {
        try {
            List<ConversationMessage> existing = conversationMessageRepository
                    .findByDiaryIdOrderBySequenceNumberAsc(diary.getId());

            ConversationMessage initial = existing.stream()
                    .filter(m -> m.getSequenceNumber() == 0 && "AI".equals(m.getRole()))
                    .findFirst()
                    .orElse(null);

            if (initial != null) {
                // 기존 레코드 삭제 후 새로 생성 (엔티티 불변 패턴)
                conversationMessageRepository.delete(initial);
                conversationMessageRepository.flush();
            }

            saveInitialConversationMessage(diary, user, content, modelName);
        } catch (Exception e) {
            log.warn("[AI] conversation_messages 업데이트 실패 (diaryId={}): {}",
                    diary.getId(), e.getMessage());
        }
    }

    private void logAiUsage(User user, Diary diary, LlmResponse response) {
        try {
            BigDecimal cost = COST_PER_TOKEN_KRW
                    .multiply(BigDecimal.valueOf(response.totalTokens()))
                    .setScale(4, RoundingMode.HALF_UP);

            AiUsageLog usageLog = AiUsageLog.builder()
                    .user(user)
                    .diary(diary)
                    .modelName(response.modelName())
                    .totalTokens(response.totalTokens())
                    .estimatedCostKrw(cost)
                    .build();
            aiUsageLogRepository.save(usageLog);
        } catch (Exception e) {
            log.warn("[AI] 사용량 로깅 실패: {}", e.getMessage());
        }
    }

    /**
     * AI 응답을 JSON 파싱하여 [content, followupQuestion] 배열로 반환한다.
     * content에는 후속 질문이 마지막 문장으로 포함된다.
     */
    private String[] parseAiResponse(String responseContent, Long diaryId) {
        try {
            JsonNode jsonNode = objectMapper.readTree(responseContent);
            String comment = jsonNode.get("comment").asText();
            String followup = jsonNode.has("followupQuestion")
                    ? jsonNode.get("followupQuestion").asText()
                    : getRandomFallbackQuestion();
            // 코멘트에 후속 질문이 포함되어 있지 않으면 마지막 문장으로 합친다
            String content = comment.contains(followup)
                    ? comment
                    : comment + " " + followup;
            return new String[]{content, followup};
        } catch (Exception e) {
            log.warn("[AI] JSON 파싱 실패, fallback 사용 (diaryId={}): {}", diaryId, e.getMessage());
            String fallback = getRandomFallbackQuestion();
            return new String[]{responseContent + " " + fallback, fallback};
        }
    }

    private String getRandomFallbackQuestion() {
        return FALLBACK_QUESTIONS.get(ThreadLocalRandom.current().nextInt(FALLBACK_QUESTIONS.size()));
    }

    private LlmResponse callLlm(Diary diary, User user) {
        log.info("[AI] 코멘트 생성 시작 (diaryId={}, userId={}, provider={})",
                diary.getId(), user.getId(), llmProvider.getClass().getSimpleName());
        String prompt = promptBuilder.build(
                promptTemplate, user, diary, aiProperties.getMaxInputChars());
        if (prompt == null) {
            return null;
        }
        LlmResponse response = llmProvider.generate(prompt, aiProperties.getMaxOutputTokens());
        log.info("[AI] 코멘트 생성 완료 (model={}, 응답길이={}자)",
                response.modelName(), response.content().length());
        return response;
    }
}
