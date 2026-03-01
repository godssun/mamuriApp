package com.github.mamuriapp.diary.service;

import com.github.mamuriapp.ai.config.AiProperties;
import com.github.mamuriapp.ai.entity.AiUsageLog;
import com.github.mamuriapp.ai.provider.LlmProvider;
import com.github.mamuriapp.ai.provider.LlmResponse;
import com.github.mamuriapp.ai.repository.AiUsageLogRepository;
import com.github.mamuriapp.ai.service.PromptBuilder;
import com.github.mamuriapp.ai.service.SafetyCheckService;
import com.github.mamuriapp.diary.dto.ConversationHistoryResponse;
import com.github.mamuriapp.diary.dto.ConversationReplyResponse;
import com.github.mamuriapp.diary.entity.ConversationMessage;
import com.github.mamuriapp.diary.entity.Diary;
import com.github.mamuriapp.diary.repository.ConversationMessageRepository;
import com.github.mamuriapp.diary.repository.DiaryRepository;
import com.github.mamuriapp.global.config.FeatureFlags;
import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.global.ratelimit.ConversationRateLimiter;
import com.github.mamuriapp.user.entity.SubscriptionTier;
import com.github.mamuriapp.user.entity.User;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 대화 서비스.
 * 일기에 대한 다회차 AI 대화를 관리한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationService {

    private static final int MAX_CONVERSATION_CONTEXT = 10;
    private static final int MAX_CONVERSATION_OUTPUT_TOKENS = 300;
    private static final BigDecimal COST_PER_TOKEN_KRW = new BigDecimal("0.0005");

    private static final String SAFETY_RESPONSE = "힘든 시간을 보내고 계시는군요. "
            + "혼자 감당하지 않아도 괜찮아요. "
            + "전문적인 도움을 받을 수 있는 곳에 연락해 보시는 건 어떨까요? "
            + "(자살예방상담전화 1393, 정신건강위기상담전화 1577-0199)";

    private final ConversationMessageRepository conversationMessageRepository;
    private final DiaryRepository diaryRepository;
    private final PromptBuilder promptBuilder;
    private final LlmProvider llmProvider;
    private final AiProperties aiProperties;
    private final SafetyCheckService safetyCheckService;
    private final AiUsageLogRepository aiUsageLogRepository;
    private final FeatureFlags featureFlags;
    private final ConversationRateLimiter rateLimiter;

    private String conversationTemplate;

    @PostConstruct
    void loadTemplate() {
        try {
            conversationTemplate = new ClassPathResource("prompts/conversation_v1.txt")
                    .getContentAsString(StandardCharsets.UTF_8);
            log.info("대화 프롬프트 템플릿 로드 완료");
        } catch (IOException e) {
            log.warn("대화 프롬프트 템플릿 로드 실패: {}", e.getMessage());
        }
    }

    /**
     * 대화 답장을 전송한다.
     *
     * @param diaryId 일기 ID
     * @param userId  사용자 ID
     * @param content 사용자 메시지 내용
     * @return 답장 응답 (사용자 메시지 + AI 응답)
     */
    @Transactional
    public ConversationReplyResponse sendReply(Long diaryId, Long userId, String content) {
        // 1. Feature flag 확인
        if (!featureFlags.isConversationEnabled()) {
            throw new CustomException(ErrorCode.CONVERSATION_NOT_FOUND);
        }

        // 2. 일기 소유권 검증
        Diary diary = diaryRepository.findByIdAndUserIdWithUser(diaryId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.DIARY_NOT_FOUND));
        User user = diary.getUser();

        // 3. 답변 제한 검사 (일별 제한, getEffectiveTier로 crisis/trial 포함)
        SubscriptionTier effectiveTier = user.getEffectiveTier();

        if (effectiveTier.isBlocked()) {
            throw new CustomException(ErrorCode.TRIAL_EXPIRED);
        }

        int usedToday = 0;
        if (!effectiveTier.isUnlimited()) {
            LocalDateTime todayStart = LocalDate.now().atStartOfDay();
            usedToday = conversationMessageRepository
                    .countByUserIdAndRoleAndCreatedAtAfter(userId, "AI", todayStart);
            if (!effectiveTier.canReply(usedToday)) {
                throw new CustomException(ErrorCode.REPLY_LIMIT_EXCEEDED);
            }
        }

        // 3.5 Rate limit 검사
        rateLimiter.checkRateLimit(userId, effectiveTier);

        // 4. 안전 검사
        boolean isSafe = safetyCheckService.checkText(content);
        if (!isSafe) {
            user.setCrisisFlag();
        }

        // 5. 사용자 메시지 저장
        int nextSeq = getNextSequenceNumber(diaryId);
        ConversationMessage userMessage = ConversationMessage.builder()
                .diary(diary)
                .user(user)
                .role("USER")
                .content(content)
                .sequenceNumber(nextSeq)
                .build();
        conversationMessageRepository.save(userMessage);

        // 6. AI 응답 생성
        String aiResponse;
        String modelName;
        Integer tokenCount = null;

        if (!isSafe) {
            aiResponse = SAFETY_RESPONSE;
            modelName = "safety-override";
        } else {
            try {
                LlmResponse response = generateConversationResponse(diary, user, diaryId);
                aiResponse = response.content();
                modelName = response.modelName();
                tokenCount = response.totalTokens();
                logAiUsage(user, diary, response);
            } catch (Exception e) {
                log.warn("[AI] 대화 응답 생성 실패 (diaryId={}): {}", diaryId, e.getMessage());
                throw new CustomException(ErrorCode.AI_SERVICE_ERROR);
            }
        }

        // 7. AI 메시지 저장
        ConversationMessage aiMessage = ConversationMessage.builder()
                .diary(diary)
                .user(user)
                .role("AI")
                .content(aiResponse)
                .sequenceNumber(nextSeq + 1)
                .modelName(modelName)
                .promptVersion("conversation_v1")
                .tokenCount(tokenCount)
                .build();
        conversationMessageRepository.save(aiMessage);

        // 8. 남은 횟수 계산 (일별 기준)
        Integer remainingReplies = effectiveTier.isUnlimited()
                ? null
                : Math.max(0, effectiveTier.getMaxRepliesPerDay() - (usedToday + 1));

        return ConversationReplyResponse.builder()
                .userMessageId(userMessage.getId())
                .aiMessageId(aiMessage.getId())
                .aiResponse(aiResponse)
                .remainingReplies(remainingReplies)
                .createdAt(aiMessage.getCreatedAt())
                .build();
    }

    /**
     * 대화 이력을 조회한다.
     *
     * @param diaryId 일기 ID
     * @param userId  사용자 ID
     * @return 대화 이력 응답
     */
    @Transactional(readOnly = true)
    public ConversationHistoryResponse getConversation(Long diaryId, Long userId) {
        if (!featureFlags.isConversationEnabled()) {
            throw new CustomException(ErrorCode.CONVERSATION_NOT_FOUND);
        }

        Diary diary = diaryRepository.findByIdAndUserIdWithUser(diaryId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.DIARY_NOT_FOUND));
        User user = diary.getUser();

        List<ConversationMessage> messages = conversationMessageRepository
                .findByDiaryIdOrderBySequenceNumberAsc(diaryId);

        SubscriptionTier effectiveTier = user.getEffectiveTier();

        // 일별 사용량 계산
        int usedToday = 0;
        if (!effectiveTier.isUnlimited()) {
            LocalDateTime todayStart = LocalDate.now().atStartOfDay();
            usedToday = conversationMessageRepository
                    .countByUserIdAndRoleAndCreatedAtAfter(user.getId(), "AI", todayStart);
        }

        List<ConversationHistoryResponse.MessageDto> messageDtos = messages.stream()
                .map(ConversationHistoryResponse.MessageDto::from)
                .toList();

        ConversationHistoryResponse.LimitsDto limits = ConversationHistoryResponse.LimitsDto.builder()
                .maxRepliesPerDay(effectiveTier.getMaxRepliesPerDay())
                .usedRepliesToday(usedToday)
                .remainingReplies(effectiveTier.isUnlimited()
                        ? null
                        : Math.max(0, effectiveTier.getMaxRepliesPerDay() - usedToday))
                .tier(effectiveTier.name())
                .trialActive(user.isTrialActive())
                .build();

        return ConversationHistoryResponse.builder()
                .diaryId(diaryId)
                .messages(messageDtos)
                .limits(limits)
                .build();
    }

    private int getNextSequenceNumber(Long diaryId) {
        List<ConversationMessage> existing = conversationMessageRepository
                .findByDiaryIdOrderBySequenceNumberAsc(diaryId);
        if (existing.isEmpty()) {
            return 0;
        }
        return existing.get(existing.size() - 1).getSequenceNumber() + 1;
    }

    private LlmResponse generateConversationResponse(Diary diary, User user, Long diaryId) {
        if (conversationTemplate == null) {
            throw new IllegalStateException("대화 프롬프트 템플릿이 로드되지 않았습니다.");
        }

        // 최근 대화 기록 조회 (최대 10개, 역순으로 조회 → 정순으로 변환)
        List<ConversationMessage> recentMessages = conversationMessageRepository
                .findRecentByDiaryId(diaryId, Pageable.ofSize(MAX_CONVERSATION_CONTEXT));
        List<ConversationMessage> orderedMessages = new ArrayList<>(recentMessages);
        Collections.reverse(orderedMessages);

        String prompt = promptBuilder.buildConversationPrompt(
                conversationTemplate, user, diary, orderedMessages, aiProperties.getMaxInputChars());

        if (prompt == null) {
            throw new CustomException(ErrorCode.AI_SERVICE_ERROR);
        }

        log.info("[AI] 대화 응답 생성 시작 (diaryId={}, userId={}, historySize={})",
                diaryId, user.getId(), orderedMessages.size());

        LlmResponse response = llmProvider.generate(prompt, MAX_CONVERSATION_OUTPUT_TOKENS);

        log.info("[AI] 대화 응답 생성 완료 (model={}, 응답길이={}자)",
                response.modelName(), response.content().length());

        return response;
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
            log.warn("[AI] 대화 사용량 로깅 실패: {}", e.getMessage());
        }
    }
}
