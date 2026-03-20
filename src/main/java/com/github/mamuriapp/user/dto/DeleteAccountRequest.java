package com.github.mamuriapp.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 계정 삭제 요청 DTO.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class DeleteAccountRequest {

    private String password;

    @NotBlank(message = "삭제 사유를 선택해주세요.")
    private String reason;

    private String reasonDetail;
}
