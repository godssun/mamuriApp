package com.github.mamuriapp.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

/**
 * Admin 로그인 요청 DTO.
 */
@Getter
public class AdminLoginRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String password;
}
