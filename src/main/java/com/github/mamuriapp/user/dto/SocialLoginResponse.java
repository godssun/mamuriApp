package com.github.mamuriapp.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 소셜 로그인 응답 DTO.
 */
@Getter
@AllArgsConstructor
public class SocialLoginResponse {

    private String accessToken;
    private String refreshToken;
    private boolean isNewUser;
    private String nickname;
}
