package com.github.mamuriapp.global.security;

import com.github.mamuriapp.global.config.JwtConfig;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * JWT 토큰 생성 및 검증 단위 테스트.
 * Spring 컨텍스트 없이 순수 단위테스트로 실행한다.
 */
class JwtTokenProviderTest {

    private static final String SECRET = "test-secret-key-minimum-32-characters-for-hmac";
    private static final long ACCESS_EXPIRATION = 1_800_000L;   // 30분
    private static final long REFRESH_EXPIRATION = 604_800_000L; // 7일

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        JwtConfig jwtConfig = new JwtConfig();
        jwtConfig.setSecret(SECRET);
        jwtConfig.setAccessExpiration(ACCESS_EXPIRATION);
        jwtConfig.setRefreshExpiration(REFRESH_EXPIRATION);

        jwtTokenProvider = new JwtTokenProvider(jwtConfig);
        jwtTokenProvider.init();
    }

    @Test
    @DisplayName("JWT-01: 액세스 토큰 생성 시 userId, email 클레임이 올바르게 포함된다")
    void createAccessToken_containsCorrectClaims() {
        // given
        Long userId = 1L;
        String email = "test@example.com";

        // when
        String token = jwtTokenProvider.createAccessToken(userId, email);

        // then
        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.getUserId(token)).isEqualTo(userId);
        assertThat(jwtTokenProvider.getEmail(token)).isEqualTo(email);
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("JWT-02: 리프레시 토큰 생성 시 유효성 검증을 통과한다")
    void createRefreshToken_isValid() {
        // given
        Long userId = 1L;
        String email = "test@example.com";

        // when
        String token = jwtTokenProvider.createRefreshToken(userId, email);

        // then
        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getUserId(token)).isEqualTo(userId);
    }

    @Test
    @DisplayName("JWT-03: 만료된 토큰은 validateToken()이 false를 반환한다")
    void validateToken_expiredToken_returnsFalse() {
        // given — 이미 만료된 토큰 직접 생성
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        String expiredToken = Jwts.builder()
                .subject("test@example.com")
                .claim("userId", 1L)
                .issuedAt(new Date(System.currentTimeMillis() - 10_000))
                .expiration(new Date(System.currentTimeMillis() - 5_000))
                .signWith(key)
                .compact();

        // when & then
        assertThat(jwtTokenProvider.validateToken(expiredToken)).isFalse();
    }

    @Test
    @DisplayName("JWT-04: 다른 키로 서명된 변조 토큰은 validateToken()이 false를 반환한다")
    void validateToken_tamperedToken_returnsFalse() {
        // given — 다른 시크릿 키로 서명된 토큰
        String differentSecret = "different-secret-key-also-at-least-32-chars!!";
        SecretKey differentKey = Keys.hmacShaKeyFor(
                differentSecret.getBytes(StandardCharsets.UTF_8));
        String tamperedToken = Jwts.builder()
                .subject("test@example.com")
                .claim("userId", 1L)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(differentKey)
                .compact();

        // when & then
        assertThat(jwtTokenProvider.validateToken(tamperedToken)).isFalse();
    }

    @Test
    @DisplayName("JWT-05: null 또는 빈 토큰은 validateToken()이 false를 반환한다")
    void validateToken_nullOrBlank_returnsFalse() {
        assertThat(jwtTokenProvider.validateToken(null)).isFalse();
        assertThat(jwtTokenProvider.validateToken("")).isFalse();
        assertThat(jwtTokenProvider.validateToken("   ")).isFalse();
        assertThat(jwtTokenProvider.validateToken("not.a.jwt")).isFalse();
    }
}
