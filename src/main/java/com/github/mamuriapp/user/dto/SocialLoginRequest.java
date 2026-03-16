package com.github.mamuriapp.user.dto;

import com.github.mamuriapp.user.entity.AuthProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

/**
 * 소셜 로그인 요청 DTO.
 */
@Getter
public class SocialLoginRequest {

    @NotNull(message = "프로바이더는 필수입니다.")
    private AuthProvider provider;

    @NotBlank(message = "토큰은 필수입니다.")
    private String token;

    /** 신규 사용자용 닉네임 (nullable). */
    private String nickname;
}
