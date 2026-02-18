package com.github.mamuriapp.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

/**
 * AI 친구 이름 변경 요청 DTO.
 */
@Getter
public class CompanionUpdateRequest {

    @NotBlank(message = "AI 이름은 필수입니다.")
    @Size(min = 1, max = 20, message = "AI 이름은 1~20자 사이여야 합니다.")
    private String aiName;
}
