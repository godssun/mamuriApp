package com.github.mamuriapp.admin.service;

import com.github.mamuriapp.admin.entity.AdminAuditLog;
import com.github.mamuriapp.admin.entity.AdminUser;
import com.github.mamuriapp.admin.repository.AdminAuditLogRepository;
import com.github.mamuriapp.admin.repository.AdminUserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Admin 감사 로그 서비스.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAuditService {

    private final AdminAuditLogRepository auditLogRepository;
    private final AdminUserRepository adminUserRepository;

    /**
     * 감사 로그를 비동기로 기록한다.
     */
    @Async
    @Transactional
    public void log(HttpServletRequest request, String action, String targetType, String targetId, String detail) {
        try {
            Long adminId = (Long) request.getAttribute("adminId");
            String adminEmail = (String) request.getAttribute("adminEmail");

            AdminUser admin = adminId != null
                    ? adminUserRepository.findById(adminId).orElse(null)
                    : null;

            AdminAuditLog auditLog = AdminAuditLog.builder()
                    .admin(admin)
                    .adminEmail(adminEmail != null ? adminEmail : "unknown")
                    .action(action)
                    .targetType(targetType)
                    .targetId(targetId)
                    .ipAddress(getClientIp(request))
                    .userAgent(truncate(request.getHeader("User-Agent"), 500))
                    .detail(detail)
                    .build();

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.warn("Failed to write audit log: {}", e.getMessage());
        }
    }

    /**
     * 감사 로그 목록을 조회한다.
     */
    @Transactional(readOnly = true)
    public Page<AdminAuditLog> getAuditLogs(int page, int size) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, Math.min(size, 100)));
    }

    /**
     * 최근 N일 감사 로그를 조회한다.
     */
    @Transactional(readOnly = true)
    public Page<AdminAuditLog> getRecentAuditLogs(int days, int page, int size) {
        return auditLogRepository.findByCreatedAtAfterOrderByCreatedAtDesc(
                LocalDate.now().minusDays(days).atStartOfDay(),
                PageRequest.of(page, Math.min(size, 100)));
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isBlank()) {
            return ip.split(",")[0].trim();
        }
        ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isBlank()) {
            return ip;
        }
        return request.getRemoteAddr();
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max) : s;
    }
}
