package com.github.mamuriapp.admin.service;

import com.github.mamuriapp.admin.dto.AdminLoginRequest;
import com.github.mamuriapp.admin.dto.AdminLoginResponse;
import com.github.mamuriapp.admin.dto.AdminMeResponse;
import com.github.mamuriapp.admin.entity.AdminRole;
import com.github.mamuriapp.admin.entity.AdminUser;
import com.github.mamuriapp.admin.repository.AdminUserRepository;
import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.global.security.JwtTokenProvider;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Admin 인증 서비스.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final AdminUserRepository adminUserRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.default-email:}")
    private String defaultEmail;

    @Value("${admin.default-password:}")
    private String defaultPassword;

    /**
     * 초기 admin 계정이 없으면 기본 계정을 생성한다.
     * ADMIN_DEFAULT_EMAIL, ADMIN_DEFAULT_PASSWORD 환경변수로 설정.
     */
    @PostConstruct
    @Transactional
    public void initDefaultAdmin() {
        if (defaultEmail == null || defaultEmail.isBlank()
            || defaultPassword == null || defaultPassword.isBlank()) {
            return;
        }

        if (!adminUserRepository.existsByEmail(defaultEmail)) {
            AdminUser admin = AdminUser.builder()
                    .email(defaultEmail)
                    .password(passwordEncoder.encode(defaultPassword))
                    .name("Admin")
                    .role(AdminRole.SUPER_ADMIN)
                    .build();
            adminUserRepository.save(admin);
            log.info("Default admin account created: {}", defaultEmail);
        }
    }

    /**
     * Admin 로그인.
     */
    @Transactional
    public AdminLoginResponse login(AdminLoginRequest request) {
        AdminUser admin = adminUserRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_CREDENTIALS));

        if (!admin.isEnabled()) {
            throw new CustomException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            throw new CustomException(ErrorCode.INVALID_CREDENTIALS);
        }

        admin.updateLastLogin();

        // Admin JWT: 기존 JwtTokenProvider 활용, userId 대신 admin ID 사용
        // claim에 "admin" 타입 구분을 위해 음수 ID 사용하지 않고,
        // 별도 admin 전용 토큰 생성
        String token = jwtTokenProvider.createAccessToken(admin.getId(), admin.getEmail());

        return AdminLoginResponse.builder()
                .accessToken(token)
                .expiresIn(1800) // 30분
                .email(admin.getEmail())
                .name(admin.getName())
                .role(admin.getRole().name())
                .build();
    }

    /**
     * 현재 Admin 사용자 정보를 조회한다.
     */
    @Transactional(readOnly = true)
    public AdminMeResponse getMe(Long adminId) {
        AdminUser admin = adminUserRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
        return AdminMeResponse.builder()
                .id(admin.getId())
                .email(admin.getEmail())
                .name(admin.getName())
                .role(admin.getRole().name())
                .lastLoginAt(admin.getLastLoginAt() != null ? admin.getLastLoginAt().toString() : null)
                .build();
    }

    /**
     * Admin 사용자인지 검증한다.
     */
    @Transactional(readOnly = true)
    public AdminUser validateAdmin(Long id, String email) {
        return adminUserRepository.findByEmail(email)
                .filter(a -> a.getId().equals(id) && a.isEnabled())
                .orElse(null);
    }
}
