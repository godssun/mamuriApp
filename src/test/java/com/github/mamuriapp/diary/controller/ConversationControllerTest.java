package com.github.mamuriapp.diary.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.mamuriapp.diary.dto.ConversationHistoryResponse;
import com.github.mamuriapp.diary.dto.ConversationReplyResponse;
import com.github.mamuriapp.diary.service.ConversationService;
import com.github.mamuriapp.global.config.JwtConfig;
import com.github.mamuriapp.global.config.SecurityConfig;
import com.github.mamuriapp.global.config.UploadProperties;
import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.global.exception.GlobalExceptionHandler;
import com.github.mamuriapp.global.ratelimit.RateLimitExceededException;
import com.github.mamuriapp.global.logging.RequestLoggingFilter;
import com.github.mamuriapp.global.security.JwtAuthenticationEntryPoint;
import com.github.mamuriapp.global.security.JwtAuthenticationFilter;
import com.github.mamuriapp.global.security.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * ConversationController 슬라이스 테스트.
 * 인증, 유효성 검증, 에러 코드를 검증한다.
 */
@WebMvcTest(ConversationController.class)
@Import({
        SecurityConfig.class,
        GlobalExceptionHandler.class,
        JwtAuthenticationEntryPoint.class,
        JwtAuthenticationFilter.class,
        RequestLoggingFilter.class,
        JwtTokenProvider.class,
        ConversationControllerTest.TestConfig.class
})
@ActiveProfiles("test")
class ConversationControllerTest {

    @TestConfiguration
    static class TestConfig {
        @Bean
        JwtConfig jwtConfig() {
            JwtConfig config = new JwtConfig();
            config.setSecret("test-secret-key-minimum-32-characters-for-hmac");
            config.setAccessExpiration(1_800_000L);
            config.setRefreshExpiration(604_800_000L);
            return config;
        }

        @Bean
        UploadProperties uploadProperties() {
            UploadProperties props = new UploadProperties();
            props.setDir(System.getProperty("java.io.tmpdir") + "/mamuri-test-uploads");
            return props;
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private ConversationService conversationService;

    private String validToken() {
        return jwtTokenProvider.createAccessToken(1L, "test@example.com");
    }

    // --- 답장 전송 ---

    @Nested
    @DisplayName("POST /api/diaries/{diaryId}/conversation/reply")
    class SendReply {

        @Test
        @DisplayName("답장 전송 성공 시 200과 응답을 반환한다")
        void sendReply_success() throws Exception {
            // given
            ConversationReplyResponse response = ConversationReplyResponse.builder()
                    .userMessageId(1L)
                    .aiMessageId(2L)
                    .aiResponse("AI 응답입니다.")
                    .remainingReplies(0)
                    .createdAt(LocalDateTime.now())
                    .build();
            given(conversationService.sendReply(anyLong(), anyLong(), anyString()))
                    .willReturn(response);

            // when & then
            mockMvc.perform(post("/api/diaries/1/conversation/reply")
                            .header("Authorization", "Bearer " + validToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    Map.of("content", "안녕하세요"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.aiResponse").value("AI 응답입니다."))
                    .andExpect(jsonPath("$.data.remainingReplies").value(0));
        }

        @Test
        @DisplayName("빈 content 전송 시 400을 반환한다")
        void sendReply_emptyContent_returns400() throws Exception {
            mockMvc.perform(post("/api/diaries/1/conversation/reply")
                            .header("Authorization", "Bearer " + validToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    Map.of("content", ""))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("content 없이 전송 시 400을 반환한다")
        void sendReply_missingContent_returns400() throws Exception {
            mockMvc.perform(post("/api/diaries/1/conversation/reply")
                            .header("Authorization", "Bearer " + validToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("답변 제한 초과 시 403을 반환한다")
        void sendReply_limitExceeded_returns403() throws Exception {
            // given
            given(conversationService.sendReply(anyLong(), anyLong(), anyString()))
                    .willThrow(new CustomException(ErrorCode.REPLY_LIMIT_EXCEEDED));

            // when & then
            mockMvc.perform(post("/api/diaries/1/conversation/reply")
                            .header("Authorization", "Bearer " + validToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    Map.of("content", "안녕하세요"))))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("존재하지 않는 일기 시 404를 반환한다")
        void sendReply_diaryNotFound_returns404() throws Exception {
            // given
            given(conversationService.sendReply(anyLong(), anyLong(), anyString()))
                    .willThrow(new CustomException(ErrorCode.DIARY_NOT_FOUND));

            // when & then
            mockMvc.perform(post("/api/diaries/999/conversation/reply")
                            .header("Authorization", "Bearer " + validToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    Map.of("content", "안녕하세요"))))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Rate limit 초과 시 429와 Retry-After 헤더를 반환한다")
        void sendReply_rateLimited_returns429() throws Exception {
            // given
            given(conversationService.sendReply(anyLong(), anyLong(), anyString()))
                    .willThrow(new RateLimitExceededException(30));

            // when & then
            mockMvc.perform(post("/api/diaries/1/conversation/reply")
                            .header("Authorization", "Bearer " + validToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    Map.of("content", "안녕하세요"))))
                    .andExpect(status().isTooManyRequests())
                    .andExpect(header().string("Retry-After", "30"))
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("미인증 상태에서 답장 전송 시 401을 반환한다")
        void sendReply_unauthenticated_returns401() throws Exception {
            mockMvc.perform(post("/api/diaries/1/conversation/reply")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    Map.of("content", "안녕하세요"))))
                    .andExpect(status().isUnauthorized());
        }
    }

    // --- 대화 이력 조회 ---

    @Nested
    @DisplayName("GET /api/diaries/{diaryId}/conversation")
    class GetConversation {

        @Test
        @DisplayName("대화 이력 조회 성공 시 200을 반환한다")
        void getConversation_success() throws Exception {
            // given
            ConversationHistoryResponse response = ConversationHistoryResponse.builder()
                    .diaryId(1L)
                    .messages(List.of(
                            ConversationHistoryResponse.MessageDto.builder()
                                    .id(1L).role("AI").content("반가워요!")
                                    .sequenceNumber(0).createdAt(LocalDateTime.now())
                                    .build()
                    ))
                    .limits(ConversationHistoryResponse.LimitsDto.builder()
                            .maxRepliesPerDay(0).usedRepliesToday(0).remainingReplies(0)
                            .tier("FREE").trialActive(false)
                            .build())
                    .build();
            given(conversationService.getConversation(anyLong(), anyLong()))
                    .willReturn(response);

            // when & then
            mockMvc.perform(get("/api/diaries/1/conversation")
                            .header("Authorization", "Bearer " + validToken()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.diaryId").value(1))
                    .andExpect(jsonPath("$.data.messages").isArray())
                    .andExpect(jsonPath("$.data.messages[0].role").value("AI"))
                    .andExpect(jsonPath("$.data.limits.maxRepliesPerDay").value(0));
        }

        @Test
        @DisplayName("대화 기능 비활성화 시 404를 반환한다")
        void getConversation_disabled_returns404() throws Exception {
            // given
            given(conversationService.getConversation(anyLong(), anyLong()))
                    .willThrow(new CustomException(ErrorCode.CONVERSATION_NOT_FOUND));

            // when & then
            mockMvc.perform(get("/api/diaries/1/conversation")
                            .header("Authorization", "Bearer " + validToken()))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("미인증 상태에서 이력 조회 시 401을 반환한다")
        void getConversation_unauthenticated_returns401() throws Exception {
            mockMvc.perform(get("/api/diaries/1/conversation"))
                    .andExpect(status().isUnauthorized());
        }
    }
}
