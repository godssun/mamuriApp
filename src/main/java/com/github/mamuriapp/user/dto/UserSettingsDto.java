package com.github.mamuriapp.user.dto;

import com.github.mamuriapp.user.entity.UserSettings;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 사용자 설정 요청/응답 DTO.
 */
@Getter
@AllArgsConstructor
public class UserSettingsDto {

    @NotBlank(message = "AI 톤은 필수입니다.")
    private String aiTone;

    private boolean aiEnabled;

    /**
     * 엔티티를 DTO로 변환한다.
     *
     * @param entity UserSettings 엔티티
     * @return UserSettingsDto
     */
    public static UserSettingsDto from(UserSettings entity) {
        return new UserSettingsDto(entity.getAiTone(), entity.isAiEnabled());
    }
}
