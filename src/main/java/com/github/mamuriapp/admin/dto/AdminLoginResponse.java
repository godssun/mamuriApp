package com.github.mamuriapp.admin.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * Admin 로그인 응답 DTO.
 */
@Getter
@Builder
public class AdminLoginResponse {

    private final String accessToken;
    private final long expiresIn;
    private final String email;
    private final String name;
    private final String role;
}
