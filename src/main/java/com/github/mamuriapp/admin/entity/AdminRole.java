package com.github.mamuriapp.admin.entity;

/**
 * Admin 역할.
 * SUPER_ADMIN: 전체 권한 (사용자 관리, 설정 변경 포함)
 * ADMIN: 대시보드 + 사용자 조회 + 감사 로그
 * VIEWER: 대시보드 조회만 가능
 */
public enum AdminRole {
    SUPER_ADMIN,
    ADMIN,
    VIEWER
}
