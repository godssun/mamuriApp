package com.github.mamuriapp.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

/**
 * 토큰 갱신 요청 DTO.
 */
@Getter
public class TokenRefreshRequest {

    @NotBlank(message = "리프레시 토큰은 필수입니다.")
    private String refreshToken;
}
