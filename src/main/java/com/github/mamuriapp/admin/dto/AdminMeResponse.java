package com.github.mamuriapp.admin.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * Admin 현재 사용자 정보 응답 DTO.
 */
@Getter
@Builder
public class AdminMeResponse {

    private final Long id;
    private final String email;
    private final String name;
    private final String role;
    private final String lastLoginAt;
}
