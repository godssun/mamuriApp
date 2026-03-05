package com.github.mamuriapp.user.service;

import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.global.security.JwtTokenProvider;
import com.github.mamuriapp.user.dto.LoginRequest;
import com.github.mamuriapp.user.dto.SignupRequest;
import com.github.mamuriapp.user.dto.TokenRefreshRequest;
import com.github.mamuriapp.user.dto.TokenResponse;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.repository.UserRepository;
import com.github.mamuriapp.user.repository.UserSettingsRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * AuthService Mockito 단위 테스트.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @InjectMocks
    private AuthService authService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserSettingsRepository userSettingsRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    // --- Helper ---

    private SignupRequest createSignupRequest(String email, String password, String nickname) {
        SignupRequest request = new SignupRequest();
        ReflectionTestUtils.setField(request, "email", email);
        ReflectionTestUtils.setField(request, "password", password);
        ReflectionTestUtils.setField(request, "nickname", nickname);
        return request;
    }

    private LoginRequest createLoginRequest(String email, String password) {
        LoginRequest request = new LoginRequest();
        ReflectionTestUtils.setField(request, "email", email);
        ReflectionTestUtils.setField(request, "password", password);
        return request;
    }

    private TokenRefreshRequest createRefreshRequest(String refreshToken) {
        TokenRefreshRequest request = new TokenRefreshRequest();
        ReflectionTestUtils.setField(request, "refreshToken", refreshToken);
        return request;
    }

    private User createUser(Long id, String email, String password) {
        User user = User.builder()
                .email(email)
                .password(password)
                .nickname("테스트")
                .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    // --- Signup ---

    @Nested
    @DisplayName("signup")
    class Signup {

        @Test
        @DisplayName("AS-01: 회원가입 성공 시 토큰을 반환하고, User와 UserSettings를 저장한다")
        void signup_success() {
            // given
            SignupRequest request = createSignupRequest("test@example.com", "Password1", "테스트");
            given(userRepository.existsByEmail("test@example.com")).willReturn(false);
            given(passwordEncoder.encode("Password1")).willReturn("encoded");
            given(userRepository.save(any(User.class))).willAnswer(invocation -> {
                User saved = invocation.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 1L);
                return saved;
            });
            given(jwtTokenProvider.createAccessToken(eq(1L), eq("test@example.com")))
                    .willReturn("access-token");
            given(jwtTokenProvider.createRefreshToken(eq(1L), eq("test@example.com")))
                    .willReturn("refresh-token");

            // when
            TokenResponse response = authService.signup(request);

            // then
            assertThat(response.getAccessToken()).isEqualTo("access-token");
            assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
            verify(userRepository).save(any(User.class));
            verify(userSettingsRepository).save(any());
        }

        @Test
        @DisplayName("AS-02: 중복 이메일로 회원가입 시 DUPLICATE_EMAIL 예외를 던진다")
        void signup_duplicateEmail_throwsException() {
            // given
            SignupRequest request = createSignupRequest("dup@example.com", "Password1", "테스트");
            given(userRepository.existsByEmail("dup@example.com")).willReturn(true);

            // when & then
            assertThatThrownBy(() -> authService.signup(request))
                    .isInstanceOf(CustomException.class)
                    .satisfies(ex -> assertThat(((CustomException) ex).getErrorCode())
                            .isEqualTo(ErrorCode.DUPLICATE_EMAIL));
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("AS-03: 회원가입 시 비밀번호를 BCrypt로 인코딩한다")
        void signup_encodesPassword() {
            // given
            SignupRequest request = createSignupRequest("test@example.com", "RawPass1", "테스트");
            given(userRepository.existsByEmail(anyString())).willReturn(false);
            given(passwordEncoder.encode("RawPass1")).willReturn("$2a$encoded");
            given(userRepository.save(any(User.class))).willAnswer(invocation -> {
                User saved = invocation.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 1L);
                return saved;
            });
            given(jwtTokenProvider.createAccessToken(anyLong(), anyString())).willReturn("at");
            given(jwtTokenProvider.createRefreshToken(anyLong(), anyString())).willReturn("rt");

            // when
            authService.signup(request);

            // then
            verify(passwordEncoder).encode("RawPass1");
        }
    }

    // --- Login ---

    @Nested
    @DisplayName("login")
    class Login {

        @Test
        @DisplayName("AS-04: 올바른 자격증명으로 로그인 시 토큰을 반환한다")
        void login_success() {
            // given
            LoginRequest request = createLoginRequest("test@example.com", "Password1");
            User user = createUser(1L, "test@example.com", "encoded");
            given(userRepository.findByEmail("test@example.com")).willReturn(Optional.of(user));
            given(passwordEncoder.matches("Password1", "encoded")).willReturn(true);
            given(jwtTokenProvider.createAccessToken(1L, "test@example.com")).willReturn("at");
            given(jwtTokenProvider.createRefreshToken(1L, "test@example.com")).willReturn("rt");

            // when
            TokenResponse response = authService.login(request);

            // then
            assertThat(response.getAccessToken()).isEqualTo("at");
            assertThat(response.getRefreshToken()).isEqualTo("rt");
        }

        @Test
        @DisplayName("AS-05: 미등록 이메일로 로그인 시 INVALID_CREDENTIALS 예외를 던진다")
        void login_unknownEmail_throwsException() {
            // given
            LoginRequest request = createLoginRequest("unknown@example.com", "Password1");
            given(userRepository.findByEmail("unknown@example.com")).willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(CustomException.class)
                    .satisfies(ex -> assertThat(((CustomException) ex).getErrorCode())
                            .isEqualTo(ErrorCode.INVALID_CREDENTIALS));
        }

        @Test
        @DisplayName("AS-06: 잘못된 비밀번호로 로그인 시 INVALID_CREDENTIALS 예외를 던진다")
        void login_wrongPassword_throwsException() {
            // given
            LoginRequest request = createLoginRequest("test@example.com", "WrongPass1");
            User user = createUser(1L, "test@example.com", "encoded");
            given(userRepository.findByEmail("test@example.com")).willReturn(Optional.of(user));
            given(passwordEncoder.matches("WrongPass1", "encoded")).willReturn(false);

            // when & then
            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(CustomException.class)
                    .satisfies(ex -> assertThat(((CustomException) ex).getErrorCode())
                            .isEqualTo(ErrorCode.INVALID_CREDENTIALS));
        }
    }

    // --- Refresh ---

    @Nested
    @DisplayName("refresh")
    class Refresh {

        @Test
        @DisplayName("AS-07: 유효한 리프레시 토큰으로 갱신 시 새 토큰 쌍을 반환한다")
        void refresh_success() {
            // given
            String oldRefresh = "old-refresh-token";
            TokenRefreshRequest request = createRefreshRequest(oldRefresh);
            User user = createUser(1L, "test@example.com", "encoded");
            user.updateRefreshToken(oldRefresh);

            given(jwtTokenProvider.validateToken(oldRefresh)).willReturn(true);
            given(jwtTokenProvider.getUserId(oldRefresh)).willReturn(1L);
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            given(jwtTokenProvider.createAccessToken(1L, "test@example.com")).willReturn("new-at");
            given(jwtTokenProvider.createRefreshToken(1L, "test@example.com")).willReturn("new-rt");

            // when
            TokenResponse response = authService.refresh(request);

            // then
            assertThat(response.getAccessToken()).isEqualTo("new-at");
            assertThat(response.getRefreshToken()).isEqualTo("new-rt");
            assertThat(user.getRefreshToken()).isEqualTo("new-rt");
        }

        @Test
        @DisplayName("AS-08: 리프레시 토큰 재사용 감지 시 TOKEN_REUSE_DETECTED 예외 + 토큰 null화")
        void refresh_tokenReuse_throwsAndNullifiesToken() {
            // given
            String reusedToken = "reused-token";
            TokenRefreshRequest request = createRefreshRequest(reusedToken);
            User user = createUser(1L, "test@example.com", "encoded");
            user.updateRefreshToken("different-token");  // DB에는 다른 토큰 저장

            given(jwtTokenProvider.validateToken(reusedToken)).willReturn(true);
            given(jwtTokenProvider.getUserId(reusedToken)).willReturn(1L);
            given(userRepository.findById(1L)).willReturn(Optional.of(user));

            // when & then
            assertThatThrownBy(() -> authService.refresh(request))
                    .isInstanceOf(CustomException.class)
                    .satisfies(ex -> assertThat(((CustomException) ex).getErrorCode())
                            .isEqualTo(ErrorCode.TOKEN_REUSE_DETECTED));
            assertThat(user.getRefreshToken()).isNull();
        }

        @Test
        @DisplayName("AS-09: 유효하지 않은 리프레시 토큰은 TOKEN_INVALID 예외를 던진다")
        void refresh_invalidToken_throwsException() {
            // given
            TokenRefreshRequest request = createRefreshRequest("invalid-token");
            given(jwtTokenProvider.validateToken("invalid-token")).willReturn(false);

            // when & then
            assertThatThrownBy(() -> authService.refresh(request))
                    .isInstanceOf(CustomException.class)
                    .satisfies(ex -> assertThat(((CustomException) ex).getErrorCode())
                            .isEqualTo(ErrorCode.TOKEN_INVALID));
        }
    }

    // --- Logout ---

    @Nested
    @DisplayName("logout")
    class Logout {

        @Test
        @DisplayName("AS-10: 로그아웃 성공 시 refreshToken을 null로 설정한다")
        void logout_success() {
            // given
            User user = createUser(1L, "test@example.com", "encoded");
            user.updateRefreshToken("some-refresh-token");
            given(userRepository.findById(1L)).willReturn(Optional.of(user));

            // when
            authService.logout(1L);

            // then
            assertThat(user.getRefreshToken()).isNull();
        }
    }
}
