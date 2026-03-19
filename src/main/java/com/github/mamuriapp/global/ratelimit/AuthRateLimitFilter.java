package com.github.mamuriapp.global.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * 인증 엔드포인트 IP 기반 Rate Limit 필터.
 * /api/auth/login, /api/auth/signup, /api/auth/social 에 대해
 * IP 주소 기반으로 분당 요청 수를 제한한다.
 */
@Slf4j
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final ConcurrentHashMap<String, Deque<Instant>> requestHistory = new ConcurrentHashMap<>();

    @Value("${rate-limit.auth.login-per-minute:5}")
    private int loginPerMinute;

    @Value("${rate-limit.auth.signup-per-minute:3}")
    private int signupPerMinute;

    @Value("${rate-limit.auth.enabled:true}")
    private boolean enabled;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.equals("/api/auth/login")
                && !path.equals("/api/auth/signup")
                && !path.equals("/api/auth/social");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = resolveClientIp(request);
        String path = request.getRequestURI();
        int limit = path.equals("/api/auth/signup") ? signupPerMinute : loginPerMinute;

        String key = clientIp + ":" + path;
        Deque<Instant> history = requestHistory.computeIfAbsent(key, k -> new ConcurrentLinkedDeque<>());
        Instant now = Instant.now();

        // 윈도우 밖 기록 정리
        Instant cutoff = now.minus(WINDOW);
        while (!history.isEmpty() && history.peekFirst().isBefore(cutoff)) {
            history.pollFirst();
        }

        if (history.size() >= limit) {
            long retryAfter = computeRetryAfter(history, now);
            log.info("[AuthRateLimit] 제한 초과 (ip={}, path={}, count={}/{})",
                    clientIp, path, history.size(), limit);

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            response.getWriter().write(
                    "{\"success\":false,\"data\":null,\"message\":\"요청이 너무 빈번합니다. "
                            + retryAfter + "초 후 다시 시도해주세요.\"}");
            return;
        }

        history.addLast(now);
        filterChain.doFilter(request, response);
    }

    private String resolveClientIp(HttpServletRequest request) {
        // Nginx가 설정하는 X-Real-IP 헤더를 우선 사용
        String ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isBlank()) {
            return ip;
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private long computeRetryAfter(Deque<Instant> history, Instant now) {
        Instant oldest = history.peekFirst();
        if (oldest == null) {
            return 1;
        }
        long seconds = Duration.between(now, oldest.plus(WINDOW)).getSeconds();
        return Math.max(1, seconds);
    }
}
