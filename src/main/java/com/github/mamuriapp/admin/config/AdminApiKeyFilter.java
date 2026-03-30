package com.github.mamuriapp.admin.config;

import com.github.mamuriapp.admin.entity.AdminUser;
import com.github.mamuriapp.admin.service.AdminAuthService;
import com.github.mamuriapp.global.security.JwtTokenProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Admin API 인증 필터.
 * /api/admin/** 요청에 대해 Admin JWT 토큰을 검증한다.
 * /api/admin/auth/login은 인증 없이 허용한다.
 */
@Component
public class AdminApiKeyFilter extends OncePerRequestFilter {

    private static final String ADMIN_API_PREFIX = "/api/admin/";
    private static final String ADMIN_AUTH_LOGIN = "/api/admin/auth/login";
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;
    private final AdminAuthService adminAuthService;

    public AdminApiKeyFilter(JwtTokenProvider jwtTokenProvider,
                             AdminAuthService adminAuthService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.adminAuthService = adminAuthService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        // Admin API 경로가 아니면 통과
        if (!path.startsWith(ADMIN_API_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 로그인 엔드포인트는 인증 없이 허용
        if (path.equals(ADMIN_AUTH_LOGIN) && "POST".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // JWT 토큰 검증
        String token = resolveToken(request);
        if (token == null || !jwtTokenProvider.validateToken(token)) {
            sendError(response, HttpStatus.UNAUTHORIZED, "인증이 필요합니다.");
            return;
        }

        Long adminId = jwtTokenProvider.getUserId(token);
        String email = jwtTokenProvider.getEmail(token);

        // Admin 사용자 검증
        AdminUser admin = adminAuthService.validateAdmin(adminId, email);
        if (admin == null) {
            sendError(response, HttpStatus.FORBIDDEN, "Admin 권한이 없습니다.");
            return;
        }

        // 요청 속성에 admin 정보 저장 (컨트롤러에서 활용)
        request.setAttribute("adminId", admin.getId());
        request.setAttribute("adminEmail", admin.getEmail());
        request.setAttribute("adminRole", admin.getRole().name());

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        return null;
    }

    private void sendError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"success\":false,\"message\":\"" + message + "\"}");
    }
}
