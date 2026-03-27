package com.github.mamuriapp.admin.dto;

import com.github.mamuriapp.admin.entity.AdminAuditLog;
import lombok.Builder;
import lombok.Getter;

/**
 * Admin 감사 로그 응답 DTO.
 */
@Getter
@Builder
public class AdminAuditLogResponse {

    private final Long id;
    private final String adminEmail;
    private final String action;
    private final String targetType;
    private final String targetId;
    private final String ipAddress;
    private final String detail;
    private final String createdAt;

    public static AdminAuditLogResponse from(AdminAuditLog log) {
        return AdminAuditLogResponse.builder()
                .id(log.getId())
                .adminEmail(log.getAdminEmail())
                .action(log.getAction())
                .targetType(log.getTargetType())
                .targetId(log.getTargetId())
                .ipAddress(log.getIpAddress())
                .detail(log.getDetail())
                .createdAt(log.getCreatedAt() != null ? log.getCreatedAt().toString() : null)
                .build();
    }
}
