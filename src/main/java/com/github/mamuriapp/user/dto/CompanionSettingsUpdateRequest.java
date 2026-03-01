package com.github.mamuriapp.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 컴패니언 개인화 설정 업데이트 요청 DTO.
 * 아바타(프로필 사진)는 별도 업로드 엔드포인트를 사용한다.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CompanionSettingsUpdateRequest {

    @NotBlank(message = "말투 스타일을 선택해주세요.")
    private String speechStyle;

    @NotBlank(message = "AI 톤을 선택해주세요.")
    private String aiTone;
}
