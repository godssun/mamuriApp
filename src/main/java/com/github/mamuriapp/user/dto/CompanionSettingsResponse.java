package com.github.mamuriapp.user.dto;

import com.github.mamuriapp.user.entity.UserSettings;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 컴패니언 개인화 설정 응답 DTO.
 */
@Getter
@AllArgsConstructor
public class CompanionSettingsResponse {

    private final String avatar;
    private final String speechStyle;
    private final String aiTone;
    private final boolean aiEnabled;

    public static CompanionSettingsResponse from(UserSettings settings) {
        return new CompanionSettingsResponse(
                settings.getAiAvatar(),
                settings.getAiSpeechStyle(),
                settings.getAiTone(),
                settings.isAiEnabled()
        );
    }
}
