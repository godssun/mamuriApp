package com.github.mamuriapp.ai.service;

import com.github.mamuriapp.ai.config.AiProperties;
import com.github.mamuriapp.ai.dto.AiCommentResponse;
import com.github.mamuriapp.ai.entity.AiComment;
import com.github.mamuriapp.ai.provider.LlmProvider;
import com.github.mamuriapp.ai.provider.LlmResponse;
import com.github.mamuriapp.ai.repository.AiCommentRepository;
import com.github.mamuriapp.ai.repository.AiUsageLogRepository;
import com.github.mamuriapp.diary.entity.Diary;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * AiCommentService 단위 테스트.
 * JSON 파싱, 후속 질문 합치기, 위기 상황 처리를 검증한다.
 */
@ExtendWith(MockitoExtension.class)
class AiCommentServiceTest {

    @InjectMocks
    private AiCommentService aiCommentService;

    @Mock
    private AiCommentRepository aiCommentRepository;

    @Mock
    private AiUsageLogRepository aiUsageLogRepository;

    @Mock
    private SafetyCheckService safetyCheckService;

    @Mock
    private LlmProvider llmProvider;

    @Mock
    private AiProperties aiProperties;

    @Mock
    private PromptBuilder promptBuilder;

    private User testUser;
    private Diary testDiary;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("test@example.com")
                .password("password")
                .nickname("테스트")
                .build();
        ReflectionTestUtils.setField(testUser, "id", 1L);

        testDiary = Diary.builder()
                .user(testUser)
                .title("테스트 일기")
                .content("오늘 하루도 수고했다.")
                .diaryDate(LocalDate.now())
                .build();
        ReflectionTestUtils.setField(testDiary, "id", 1L);

        ReflectionTestUtils.setField(aiCommentService, "promptTemplate", "테스트 프롬프트 {{content}}");

        lenient().when(aiProperties.getPromptVersion()).thenReturn("v3");
        lenient().when(aiProperties.getMaxInputChars()).thenReturn(3000);
        lenient().when(aiProperties.getMaxOutputTokens()).thenReturn(180);
        lenient().when(promptBuilder.build(anyString(), any(), any(), anyInt())).thenReturn("built prompt");
        lenient().when(aiCommentRepository.save(any(AiComment.class))).thenAnswer(invocation -> {
            AiComment comment = invocation.getArgument(0);
            ReflectionTestUtils.setField(comment, "id", 100L);
            return comment;
        });
    }

    @Nested
    @DisplayName("generateComment - JSON 파싱 및 후속 질문 합치기")
    class GenerateCommentJsonParsing {

        @Test
        @DisplayName("코멘트에 이미 후속 질문이 포함되어 있으면 그대로 사용한다")
        void generateComment_questionAlreadyInComment_noDoubling() {
            // given — comment에 질문이 이미 마지막 문장으로 포함됨
            String jsonResponse = "{\"comment\":\"오늘 정말 수고하셨어요. 내일은 어떤 하루가 되었으면 좋겠나요?\",\"followupQuestion\":\"내일은 어떤 하루가 되었으면 좋겠나요?\"}";
            when(llmProvider.generate(anyString(), anyInt()))
                    .thenReturn(new LlmResponse(jsonResponse, "gpt-4o-mini", 100));

            // when
            AiCommentResponse result = aiCommentService.generateComment(testDiary, testUser, true);

            // then — 중복 없이 그대로
            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEqualTo("오늘 정말 수고하셨어요. 내일은 어떤 하루가 되었으면 좋겠나요?");
        }

        @Test
        @DisplayName("코멘트에 후속 질문이 없으면 마지막 문장으로 합쳐진다")
        void generateComment_questionSeparate_appendedToComment() {
            // given — AI가 comment와 followupQuestion을 분리해서 보냄
            String jsonResponse = "{\"comment\":\"오늘 정말 수고하셨어요.\",\"followupQuestion\":\"내일은 어떤 하루가 되었으면 좋겠나요?\"}";
            when(llmProvider.generate(anyString(), anyInt()))
                    .thenReturn(new LlmResponse(jsonResponse, "gpt-4o-mini", 100));

            // when
            AiCommentResponse result = aiCommentService.generateComment(testDiary, testUser, true);

            // then — 후속 질문이 합쳐져서 표시
            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEqualTo("오늘 정말 수고하셨어요. 내일은 어떤 하루가 되었으면 좋겠나요?");
        }

        @Test
        @DisplayName("JSON 파싱 실패 시 원본 응답에 fallback 질문이 합쳐진다")
        void generateComment_invalidJson_fallbackAppended() {
            // given
            String plainResponse = "오늘 정말 수고하셨어요.";
            when(llmProvider.generate(anyString(), anyInt()))
                    .thenReturn(new LlmResponse(plainResponse, "gpt-4o-mini", 100));

            // when
            AiCommentResponse result = aiCommentService.generateComment(testDiary, testUser, true);

            // then — 원본 + fallback 질문이 합쳐짐
            assertThat(result).isNotNull();
            assertThat(result.getContent()).startsWith(plainResponse + " ");
            assertThat(result.getContent()).contains("?"); // fallback 질문은 물음표를 포함
        }

        @Test
        @DisplayName("JSON에 followupQuestion이 없으면 fallback 질문이 합쳐진다")
        void generateComment_jsonWithoutFollowup_fallbackAppended() {
            // given
            String partialJson = "{\"comment\":\"오늘 정말 수고하셨어요.\"}";
            when(llmProvider.generate(anyString(), anyInt()))
                    .thenReturn(new LlmResponse(partialJson, "gpt-4o-mini", 100));

            // when
            AiCommentResponse result = aiCommentService.generateComment(testDiary, testUser, true);

            // then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).startsWith("오늘 정말 수고하셨어요. ");
            assertThat(result.getContent().length()).isGreaterThan("오늘 정말 수고하셨어요.".length());
        }
    }

    @Nested
    @DisplayName("generateComment - 위기 상황")
    class GenerateCommentCrisis {

        @Test
        @DisplayName("위기 상황(isSafe=false)에서는 안전 메시지만 반환된다")
        void generateComment_crisis_safetyMessage() {
            // when
            AiCommentResponse result = aiCommentService.generateComment(testDiary, testUser, false);

            // then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).contains("1393");
            assertThat(result.getContent()).contains("1577-0199");

            // LLM은 호출되지 않아야 한다
            verify(llmProvider, never()).generate(anyString(), anyInt());
        }
    }

    @Nested
    @DisplayName("generateComment - AiComment 엔티티 저장")
    class GenerateCommentSave {

        @Test
        @DisplayName("엔티티의 content에 후속 질문이 포함되고, followupQuestion에 분석용으로 별도 저장된다")
        void generateComment_savesContentWithQuestion() {
            // given — AI가 분리해서 보낸 경우
            String jsonResponse = "{\"comment\":\"좋은 하루네요!\",\"followupQuestion\":\"오늘 가장 즐거웠던 순간은?\"}";
            when(llmProvider.generate(anyString(), anyInt()))
                    .thenReturn(new LlmResponse(jsonResponse, "gpt-4o-mini", 100));

            ArgumentCaptor<AiComment> captor = ArgumentCaptor.forClass(AiComment.class);

            // when
            aiCommentService.generateComment(testDiary, testUser, true);

            // then
            verify(aiCommentRepository).save(captor.capture());
            AiComment saved = captor.getValue();
            assertThat(saved.getContent()).isEqualTo("좋은 하루네요! 오늘 가장 즐거웠던 순간은?");
            assertThat(saved.getFollowupQuestion()).isEqualTo("오늘 가장 즐거웠던 순간은?");
        }
    }
}
