package com.github.mamuriapp.diary.service;

import com.github.mamuriapp.ai.config.AiProperties;
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
import com.github.mamuriapp.user.entity.SubscriptionStatus;
import com.github.mamuriapp.user.entity.SubscriptionTier;
import com.github.mamuriapp.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * ConversationService 단위 테스트.
 * 티어별 일일 답변 제한, 위기 상황, 권한 검증을 검증한다.
 */
@ExtendWith(MockitoExtension.class)
class ConversationServiceTest {

    @InjectMocks
    private ConversationService conversationService;

    @Mock
    private ConversationMessageRepository conversationMessageRepository;

    @Mock
    private DiaryRepository diaryRepository;

    @Mock
    private PromptBuilder promptBuilder;

    @Mock
    private LlmProvider llmProvider;

    @Mock
    private AiProperties aiProperties;

    @Mock
    private SafetyCheckService safetyCheckService;

    @Mock
    private AiUsageLogRepository aiUsageLogRepository;

    @Mock
    private FeatureFlags featureFlags;

    @Mock
    private ConversationRateLimiter rateLimiter;

    private User freeUser;
    private User deluxeUser;
    private User premiumUser;
    private Diary testDiary;

    @BeforeEach
    void setUp() {
        // Feature flag 활성화
        lenient().when(featureFlags.isConversationEnabled()).thenReturn(true);

        // 안전 검사 기본값: 안전
        lenient().when(safetyCheckService.checkText(anyString())).thenReturn(true);

        // LLM 기본 응답
        lenient().when(promptBuilder.buildConversationPrompt(any(), any(), any(), any(), anyInt()))
                .thenReturn("built prompt");
        lenient().when(llmProvider.generate(anyString(), anyInt()))
                .thenReturn(new LlmResponse("AI 응답입니다.", "gpt-4o-mini", 100));
        lenient().when(aiProperties.getMaxInputChars()).thenReturn(3000);

        // 대화 템플릿 설정
        ReflectionTestUtils.setField(conversationService, "conversationTemplate", "{{content}} {{conversationHistory}}");

        // 사용자 생성
        freeUser = User.builder().email("free@test.com").password("pass").nickname("무료유저").build();
        ReflectionTestUtils.setField(freeUser, "id", 1L);

        deluxeUser = User.builder().email("deluxe@test.com").password("pass").nickname("디럭스유저").build();
        ReflectionTestUtils.setField(deluxeUser, "id", 2L);
        deluxeUser.updateSubscriptionTier(SubscriptionTier.DELUXE);

        premiumUser = User.builder().email("premium@test.com").password("pass").nickname("프리미엄유저").build();
        ReflectionTestUtils.setField(premiumUser, "id", 3L);
        premiumUser.updateSubscriptionTier(SubscriptionTier.PREMIUM);

        // 기본 일기
        testDiary = Diary.builder()
                .user(freeUser)
                .title("테스트 일기")
                .content("오늘 하루도 수고했다.")
                .diaryDate(LocalDate.now())
                .build();
        ReflectionTestUtils.setField(testDiary, "id", 1L);

        // 메시지 저장 mock
        lenient().when(conversationMessageRepository.save(any(ConversationMessage.class)))
                .thenAnswer(invocation -> {
                    ConversationMessage msg = invocation.getArgument(0);
                    ReflectionTestUtils.setField(msg, "id", (long) (Math.random() * 10000));
                    ReflectionTestUtils.setField(msg, "createdAt", LocalDateTime.now());
                    return msg;
                });
    }

    // --- 티어별 답변 제한 (일별) ---

    @Nested
    @DisplayName("FREE 티어 답변 제한 (하루 1회 맛보기)")
    class FreeTierLimit {

        @Test
        @DisplayName("FREE: 오늘 0회 사용 시 첫 답변은 성공한다")
        void free_firstReply_success() {
            // given - FREE 유저 (maxRepliesPerDay = 1)
            when(diaryRepository.findByIdAndUserIdWithUser(1L, 1L))
                    .thenReturn(Optional.of(testDiary));
            when(conversationMessageRepository.countByUserIdAndRoleAndCreatedAtAfter(
                    eq(1L), eq("AI"), any(LocalDateTime.class))).thenReturn(0);
            when(conversationMessageRepository.findByDiaryIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of());

            // when
            ConversationReplyResponse response = conversationService.sendReply(1L, 1L, "안녕하세요");

            // then
            assertThat(response).isNotNull();
            assertThat(response.getRemainingReplies()).isEqualTo(0);
        }

        @Test
        @DisplayName("FREE: 오늘 1회 사용 후 2번째 답변은 REPLY_LIMIT_EXCEEDED 에러를 반환한다")
        void free_secondReply_limitExceeded() {
            // given - FREE 유저, 오늘 1회 사용
            when(diaryRepository.findByIdAndUserIdWithUser(1L, 1L))
                    .thenReturn(Optional.of(testDiary));
            when(conversationMessageRepository.countByUserIdAndRoleAndCreatedAtAfter(
                    eq(1L), eq("AI"), any(LocalDateTime.class))).thenReturn(1);

            // when & then
            assertThatThrownBy(() -> conversationService.sendReply(1L, 1L, "안녕하세요"))
                    .isInstanceOf(CustomException.class)
                    .satisfies(ex -> {
                        CustomException ce = (CustomException) ex;
                        assertThat(ce.getErrorCode()).isEqualTo(ErrorCode.REPLY_LIMIT_EXCEEDED);
                    });
        }
    }

    @Nested
    @DisplayName("DELUXE 티어 답변 제한 (하루 3회)")
    class DeluxeTierLimit {

        @BeforeEach
        void setUpDeluxeDiary() {
            testDiary = Diary.builder()
                    .user(deluxeUser)
                    .title("디럭스 일기")
                    .content("오늘 하루")
                    .diaryDate(LocalDate.now())
                    .build();
            ReflectionTestUtils.setField(testDiary, "id", 2L);
        }

        @Test
        @DisplayName("DELUXE: 오늘 2회 사용 후 3번째 답변은 성공한다")
        void deluxe_thirdReply_success() {
            // given
            when(diaryRepository.findByIdAndUserIdWithUser(2L, 2L))
                    .thenReturn(Optional.of(testDiary));
            when(conversationMessageRepository.countByUserIdAndRoleAndCreatedAtAfter(
                    eq(2L), eq("AI"), any(LocalDateTime.class))).thenReturn(2);
            when(conversationMessageRepository.findByDiaryIdOrderBySequenceNumberAsc(2L))
                    .thenReturn(List.of());
            when(conversationMessageRepository.findRecentByDiaryId(eq(2L), any()))
                    .thenReturn(List.of());

            // when
            ConversationReplyResponse response = conversationService.sendReply(2L, 2L, "세 번째");

            // then
            assertThat(response).isNotNull();
            assertThat(response.getRemainingReplies()).isEqualTo(0); // 3-3=0
        }

        @Test
        @DisplayName("DELUXE: 오늘 3회 사용 후 4번째 답변은 차단된다")
        void deluxe_fourthReply_blocked() {
            // given
            when(diaryRepository.findByIdAndUserIdWithUser(2L, 2L))
                    .thenReturn(Optional.of(testDiary));
            when(conversationMessageRepository.countByUserIdAndRoleAndCreatedAtAfter(
                    eq(2L), eq("AI"), any(LocalDateTime.class))).thenReturn(3);

            // when & then
            assertThatThrownBy(() -> conversationService.sendReply(2L, 2L, "네 번째"))
                    .isInstanceOf(CustomException.class)
                    .satisfies(ex -> {
                        CustomException ce = (CustomException) ex;
                        assertThat(ce.getErrorCode()).isEqualTo(ErrorCode.REPLY_LIMIT_EXCEEDED);
                    });
        }
    }

    @Nested
    @DisplayName("PREMIUM 티어 (무제한)")
    class PremiumTierUnlimited {

        @BeforeEach
        void setUpPremiumDiary() {
            testDiary = Diary.builder()
                    .user(premiumUser)
                    .title("프리미엄 일기")
                    .content("오늘 하루")
                    .diaryDate(LocalDate.now())
                    .build();
            ReflectionTestUtils.setField(testDiary, "id", 3L);
        }

        @Test
        @DisplayName("PREMIUM: 무제한으로 답변 가능하다")
        void premium_unlimited() {
            // given
            when(diaryRepository.findByIdAndUserIdWithUser(3L, 3L))
                    .thenReturn(Optional.of(testDiary));
            when(conversationMessageRepository.findByDiaryIdOrderBySequenceNumberAsc(3L))
                    .thenReturn(List.of());
            when(conversationMessageRepository.findRecentByDiaryId(eq(3L), any()))
                    .thenReturn(List.of());

            // when
            ConversationReplyResponse response = conversationService.sendReply(3L, 3L, "답변 요청");

            // then
            assertThat(response).isNotNull();
            assertThat(response.getRemainingReplies()).isNull(); // 무제한
        }
    }

    // --- Trial 관련 ---

    @Nested
    @DisplayName("Trial 처리")
    class TrialHandling {

        @Test
        @DisplayName("Trial 활성 FREE 유저는 DELUXE처럼 대화할 수 있다")
        void trialActive_canReplyAsDeluxe() {
            // given - FREE 유저에 trial 활성화
            ReflectionTestUtils.setField(freeUser, "subscriptionStatus", SubscriptionStatus.TRIALING);
            ReflectionTestUtils.setField(freeUser, "trialEnd", LocalDateTime.now().plusDays(5));

            when(diaryRepository.findByIdAndUserIdWithUser(1L, 1L))
                    .thenReturn(Optional.of(testDiary));
            when(conversationMessageRepository.countByUserIdAndRoleAndCreatedAtAfter(
                    eq(1L), eq("AI"), any(LocalDateTime.class))).thenReturn(0);
            when(conversationMessageRepository.findByDiaryIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of());
            when(conversationMessageRepository.findRecentByDiaryId(eq(1L), any()))
                    .thenReturn(List.of());

            // when
            ConversationReplyResponse response = conversationService.sendReply(1L, 1L, "안녕하세요");

            // then
            assertThat(response).isNotNull();
            assertThat(response.getAiResponse()).isEqualTo("AI 응답입니다.");
            assertThat(response.getRemainingReplies()).isEqualTo(2); // 3-1=2
        }
    }

    // --- 위기 상황 ---

    @Nested
    @DisplayName("위기 상황 처리")
    class CrisisHandling {

        @Test
        @DisplayName("위기 키워드 감지 시 안전 메시지를 반환한다")
        void crisis_safetyResponse() {
            // given - FREE 유저라도 crisis 시에는 getEffectiveTier() = PREMIUM
            ReflectionTestUtils.setField(freeUser, "crisisFlagUntil",
                    LocalDateTime.now().plusDays(7));

            when(diaryRepository.findByIdAndUserIdWithUser(1L, 1L))
                    .thenReturn(Optional.of(testDiary));
            when(conversationMessageRepository.findByDiaryIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of());
            when(safetyCheckService.checkText("죽고 싶어")).thenReturn(false);

            // when
            ConversationReplyResponse response = conversationService.sendReply(1L, 1L, "죽고 싶어");

            // then
            assertThat(response.getAiResponse()).contains("1393");
            assertThat(response.getAiResponse()).contains("1577-0199");

            // LLM은 호출되지 않아야 한다
            verify(llmProvider, never()).generate(anyString(), anyInt());
        }

        @Test
        @DisplayName("위기 상황(crisis flag)에서는 FREE 제한을 무시한다")
        void crisisFlag_bypassesLimit() {
            // given - FREE 유저지만 crisis flag 활성 → getEffectiveTier() = PREMIUM
            ReflectionTestUtils.setField(freeUser, "crisisFlagUntil",
                    LocalDateTime.now().plusDays(7));

            when(diaryRepository.findByIdAndUserIdWithUser(1L, 1L))
                    .thenReturn(Optional.of(testDiary));
            when(conversationMessageRepository.findByDiaryIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of());
            when(conversationMessageRepository.findRecentByDiaryId(eq(1L), any()))
                    .thenReturn(List.of());

            // when - 정상 메시지 전송
            ConversationReplyResponse response = conversationService.sendReply(1L, 1L, "도와주세요");

            // then - 차단되지 않고 응답 성공
            assertThat(response).isNotNull();
            assertThat(response.getAiResponse()).isEqualTo("AI 응답입니다.");
        }
    }

    // --- 권한 검증 ---

    @Nested
    @DisplayName("권한 검증")
    class Authorization {

        @Test
        @DisplayName("타인의 일기에 답장 시 DIARY_NOT_FOUND 예외가 발생한다")
        void otherUserDiary_throwsNotFound() {
            // given - userId=1의 일기를 userId=99가 접근
            when(diaryRepository.findByIdAndUserIdWithUser(1L, 99L))
                    .thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> conversationService.sendReply(1L, 99L, "안녕"))
                    .isInstanceOf(CustomException.class)
                    .satisfies(ex -> {
                        CustomException ce = (CustomException) ex;
                        assertThat(ce.getErrorCode()).isEqualTo(ErrorCode.DIARY_NOT_FOUND);
                    });
        }

        @Test
        @DisplayName("존재하지 않는 일기에 답장 시 DIARY_NOT_FOUND 예외가 발생한다")
        void nonExistentDiary_throwsNotFound() {
            // given
            when(diaryRepository.findByIdAndUserIdWithUser(999L, 1L))
                    .thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> conversationService.sendReply(999L, 1L, "안녕"))
                    .isInstanceOf(CustomException.class)
                    .satisfies(ex -> {
                        CustomException ce = (CustomException) ex;
                        assertThat(ce.getErrorCode()).isEqualTo(ErrorCode.DIARY_NOT_FOUND);
                    });
        }
    }

    // --- Feature Flag ---

    @Nested
    @DisplayName("Feature Flag 비활성화")
    class FeatureFlagDisabled {

        @Test
        @DisplayName("대화 기능 비활성화 시 sendReply는 예외를 던진다")
        void conversationDisabled_sendReply_throws() {
            // given
            when(featureFlags.isConversationEnabled()).thenReturn(false);

            // when & then
            assertThatThrownBy(() -> conversationService.sendReply(1L, 1L, "안녕"))
                    .isInstanceOf(CustomException.class)
                    .satisfies(ex -> {
                        CustomException ce = (CustomException) ex;
                        assertThat(ce.getErrorCode()).isEqualTo(ErrorCode.CONVERSATION_NOT_FOUND);
                    });
        }

        @Test
        @DisplayName("대화 기능 비활성화 시 getConversation은 예외를 던진다")
        void conversationDisabled_getConversation_throws() {
            // given
            when(featureFlags.isConversationEnabled()).thenReturn(false);

            // when & then
            assertThatThrownBy(() -> conversationService.getConversation(1L, 1L))
                    .isInstanceOf(CustomException.class)
                    .satisfies(ex -> {
                        CustomException ce = (CustomException) ex;
                        assertThat(ce.getErrorCode()).isEqualTo(ErrorCode.CONVERSATION_NOT_FOUND);
                    });
        }
    }

    // --- 대화 이력 조회 ---

    @Nested
    @DisplayName("getConversation - 대화 이력 조회")
    class GetConversation {

        @Test
        @DisplayName("대화 이력을 정상적으로 반환한다 (일별 제한 정보 포함)")
        void getConversation_success() {
            // given - DELUXE 유저
            testDiary = Diary.builder()
                    .user(deluxeUser)
                    .title("디럭스 일기")
                    .content("오늘 하루")
                    .diaryDate(LocalDate.now())
                    .build();
            ReflectionTestUtils.setField(testDiary, "id", 2L);

            when(diaryRepository.findByIdAndUserIdWithUser(2L, 2L))
                    .thenReturn(Optional.of(testDiary));

            ConversationMessage aiMsg = ConversationMessage.builder()
                    .diary(testDiary).user(deluxeUser).role("AI")
                    .content("반가워요!").sequenceNumber(0)
                    .modelName("gpt-4o-mini").promptVersion("v4")
                    .build();
            ReflectionTestUtils.setField(aiMsg, "id", 1L);
            ReflectionTestUtils.setField(aiMsg, "createdAt", LocalDateTime.now());

            when(conversationMessageRepository.findByDiaryIdOrderBySequenceNumberAsc(2L))
                    .thenReturn(List.of(aiMsg));
            when(conversationMessageRepository.countByUserIdAndRoleAndCreatedAtAfter(
                    eq(2L), eq("AI"), any(LocalDateTime.class))).thenReturn(1);

            // when
            ConversationHistoryResponse response = conversationService.getConversation(2L, 2L);

            // then
            assertThat(response.getDiaryId()).isEqualTo(2L);
            assertThat(response.getMessages()).hasSize(1);
            assertThat(response.getMessages().get(0).getRole()).isEqualTo("AI");
            assertThat(response.getLimits().getMaxRepliesPerDay()).isEqualTo(3); // DELUXE
            assertThat(response.getLimits().getUsedRepliesToday()).isEqualTo(1);
            assertThat(response.getLimits().getRemainingReplies()).isEqualTo(2);
            assertThat(response.getLimits().getTier()).isEqualTo("DELUXE");
        }
    }

    // --- 메시지 저장 ---

    @Nested
    @DisplayName("메시지 저장 검증")
    class MessageSaving {

        @Test
        @DisplayName("사용자 메시지와 AI 메시지가 올바른 순서로 저장된다")
        void messagesAreSavedInOrder() {
            // given - DELUXE 유저
            testDiary = Diary.builder()
                    .user(deluxeUser)
                    .title("디럭스 일기")
                    .content("오늘 하루")
                    .diaryDate(LocalDate.now())
                    .build();
            ReflectionTestUtils.setField(testDiary, "id", 2L);

            when(diaryRepository.findByIdAndUserIdWithUser(2L, 2L))
                    .thenReturn(Optional.of(testDiary));
            when(conversationMessageRepository.countByUserIdAndRoleAndCreatedAtAfter(
                    eq(2L), eq("AI"), any(LocalDateTime.class))).thenReturn(0);
            when(conversationMessageRepository.findByDiaryIdOrderBySequenceNumberAsc(2L))
                    .thenReturn(List.of());
            when(conversationMessageRepository.findRecentByDiaryId(eq(2L), any()))
                    .thenReturn(List.of());

            ArgumentCaptor<ConversationMessage> captor = ArgumentCaptor.forClass(ConversationMessage.class);

            // when
            conversationService.sendReply(2L, 2L, "안녕하세요");

            // then - 사용자 메시지 + AI 메시지 = 2번 저장
            verify(conversationMessageRepository, times(2)).save(captor.capture());
            List<ConversationMessage> saved = captor.getAllValues();

            assertThat(saved.get(0).getRole()).isEqualTo("USER");
            assertThat(saved.get(0).getContent()).isEqualTo("안녕하세요");
            assertThat(saved.get(0).getSequenceNumber()).isEqualTo(0);

            assertThat(saved.get(1).getRole()).isEqualTo("AI");
            assertThat(saved.get(1).getContent()).isEqualTo("AI 응답입니다.");
            assertThat(saved.get(1).getSequenceNumber()).isEqualTo(1);
        }
    }
}
