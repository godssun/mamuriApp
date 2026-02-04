package com.github.mamuriapp.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 인증 토큰 응답 DTO.
 */
@Getter
@AllArgsConstructor
public class TokenResponse {

    private String accessToken;
    private String refreshToken;
}
