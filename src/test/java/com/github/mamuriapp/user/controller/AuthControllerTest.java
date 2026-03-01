package com.github.mamuriapp.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.mamuriapp.global.config.JwtConfig;
import com.github.mamuriapp.global.config.SecurityConfig;
import com.github.mamuriapp.global.config.UploadProperties;
import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.global.exception.GlobalExceptionHandler;
import com.github.mamuriapp.global.logging.RequestLoggingFilter;
import com.github.mamuriapp.global.security.JwtAuthenticationEntryPoint;
import com.github.mamuriapp.global.security.JwtAuthenticationFilter;
import com.github.mamuriapp.global.security.JwtTokenProvider;
import com.github.mamuriapp.user.dto.TokenResponse;
import com.github.mamuriapp.user.service.AuthService;
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

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * AuthController 슬라이스 테스트.
 * 보안 필터 체인 + 유효성 검증 + 예외 핸들러를 함께 테스트한다.
 */
@WebMvcTest(AuthController.class)
@Import({
        SecurityConfig.class,
        GlobalExceptionHandler.class,
        JwtAuthenticationEntryPoint.class,
        JwtAuthenticationFilter.class,
        RequestLoggingFilter.class,
        JwtTokenProvider.class,
        AuthControllerTest.TestJwtConfig.class
})
@ActiveProfiles("test")
class AuthControllerTest {

    @TestConfiguration
    static class TestJwtConfig {
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
    private AuthService authService;


    // --- Signup ---

    @Nested
    @DisplayName("POST /api/auth/signup")
    class Signup {

        @Test
        @DisplayName("AC-01: 회원가입 성공 시 201과 토큰을 반환한다")
        void signup_success() throws Exception {
            // given
            given(authService.signup(any())).willReturn(new TokenResponse("at", "rt"));
            Map<String, String> body = Map.of(
                    "email", "test@example.com",
                    "password", "Password1",
                    "nickname", "테스트유저"
            );

            // when & then
            mockMvc.perform(post("/api/auth/signup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.accessToken").value("at"))
                    .andExpect(jsonPath("$.data.refreshToken").value("rt"));
        }

        @Test
        @DisplayName("AC-02: 이메일 형식 오류 시 400을 반환한다")
        void signup_invalidEmail_returns400() throws Exception {
            Map<String, String> body = Map.of(
                    "email", "not-an-email",
                    "password", "Password1",
                    "nickname", "테스트"
            );

            mockMvc.perform(post("/api/auth/signup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("AC-03: 비밀번호가 7자로 짧은 경우 400을 반환한다")
        void signup_shortPassword_returns400() throws Exception {
            Map<String, String> body = Map.of(
                    "email", "test@example.com",
                    "password", "Pass1ab",  // 7자
                    "nickname", "테스트"
            );

            mockMvc.perform(post("/api/auth/signup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("AC-04: 비밀번호에 숫자가 없는 경우 400을 반환한다")
        void signup_noDigitPassword_returns400() throws Exception {
            Map<String, String> body = Map.of(
                    "email", "test@example.com",
                    "password", "PasswordOnly",
                    "nickname", "테스트"
            );

            mockMvc.perform(post("/api/auth/signup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("AC-05: 중복 이메일 시 409를 반환한다")
        void signup_duplicateEmail_returns409() throws Exception {
            // given
            given(authService.signup(any()))
                    .willThrow(new CustomException(ErrorCode.DUPLICATE_EMAIL));
            Map<String, String> body = Map.of(
                    "email", "dup@example.com",
                    "password", "Password1",
                    "nickname", "테스트"
            );

            // when & then
            mockMvc.perform(post("/api/auth/signup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    // --- Login ---

    @Nested
    @DisplayName("POST /api/auth/login")
    class Login {

        @Test
        @DisplayName("AC-06: 로그인 성공 시 200과 토큰을 반환한다")
        void login_success() throws Exception {
            // given
            given(authService.login(any())).willReturn(new TokenResponse("at", "rt"));
            Map<String, String> body = Map.of(
                    "email", "test@example.com",
                    "password", "Password1"
            );

            // when & then
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.accessToken").value("at"));
        }

        @Test
        @DisplayName("AC-07: 로그인 실패 시 401을 반환한다")
        void login_failure_returns401() throws Exception {
            // given
            given(authService.login(any()))
                    .willThrow(new CustomException(ErrorCode.INVALID_CREDENTIALS));
            Map<String, String> body = Map.of(
                    "email", "test@example.com",
                    "password", "WrongPass1"
            );

            // when & then
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("AC-08: 빈 바디로 로그인 시 400을 반환한다")
        void login_emptyBody_returns400() throws Exception {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    // --- Refresh ---

    @Nested
    @DisplayName("POST /api/auth/refresh")
    class Refresh {

        @Test
        @DisplayName("AC-09: 토큰 갱신 성공 시 200과 새 토큰을 반환한다")
        void refresh_success() throws Exception {
            // given
            given(authService.refresh(any())).willReturn(new TokenResponse("new-at", "new-rt"));
            Map<String, String> body = Map.of("refreshToken", "valid-refresh-token");

            // when & then
            mockMvc.perform(post("/api/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.accessToken").value("new-at"))
                    .andExpect(jsonPath("$.data.refreshToken").value("new-rt"));
        }

        @Test
        @DisplayName("AC-10: 토큰 재사용 감지 시 401을 반환한다")
        void refresh_tokenReuse_returns401() throws Exception {
            // given
            given(authService.refresh(any()))
                    .willThrow(new CustomException(ErrorCode.TOKEN_REUSE_DETECTED));
            Map<String, String> body = Map.of("refreshToken", "reused-token");

            // when & then
            mockMvc.perform(post("/api/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    // --- Logout ---

    @Nested
    @DisplayName("POST /api/auth/logout")
    class Logout {

        @Test
        @DisplayName("AC-11: 인증된 사용자의 로그아웃 시 200을 반환한다")
        void logout_authenticated_returns200() throws Exception {
            // given
            doNothing().when(authService).logout(1L);
            String validToken = jwtTokenProvider.createAccessToken(1L, "test@example.com");

            // when & then
            mockMvc.perform(post("/api/auth/logout")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("AC-12: 미인증 사용자의 로그아웃 시 401을 반환한다")
        void logout_unauthenticated_returns401() throws Exception {
            mockMvc.perform(post("/api/auth/logout"))
                    .andExpect(status().isUnauthorized());
        }
    }
}
