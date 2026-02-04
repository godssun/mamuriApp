package com.github.mamuriapp.global.security;

import com.github.mamuriapp.global.config.JwtConfig;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 토큰 생성 및 검증을 담당하는 컴포넌트.
 */
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtConfig jwtConfig;
    private SecretKey secretKey;

    @PostConstruct
    void init() {
        this.secretKey = Keys.hmacShaKeyFor(
                jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 액세스 토큰을 생성한다.
     *
     * @param userId 사용자 ID
     * @param email  사용자 이메일
     * @return 서명된 JWT 액세스 토큰
     */
    public String createAccessToken(Long userId, String email) {
        return createToken(userId, email, jwtConfig.getAccessExpiration());
    }

    /**
     * 리프레시 토큰을 생성한다.
     *
     * @param userId 사용자 ID
     * @param email  사용자 이메일
     * @return 서명된 JWT 리프레시 토큰
     */
    public String createRefreshToken(Long userId, String email) {
        return createToken(userId, email, jwtConfig.getRefreshExpiration());
    }

    /**
     * 토큰에서 사용자 ID를 추출한다.
     *
     * @param token JWT 토큰
     * @return 사용자 ID
     */
    public Long getUserId(String token) {
        return parseClaims(token).get("userId", Long.class);
    }

    /**
     * 토큰에서 이메일을 추출한다.
     *
     * @param token JWT 토큰
     * @return 사용자 이메일
     */
    public String getEmail(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * 토큰의 유효성을 검증한다.
     *
     * @param token JWT 토큰
     * @return 유효하면 true, 아니면 false
     */
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private String createToken(Long userId, String email, long expiration) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
