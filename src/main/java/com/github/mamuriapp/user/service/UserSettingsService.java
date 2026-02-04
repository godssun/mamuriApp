package com.github.mamuriapp.user.service;

import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.user.dto.UserSettingsDto;
import com.github.mamuriapp.user.entity.UserSettings;
import com.github.mamuriapp.user.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 사용자 설정 서비스.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserSettingsService {

    private final UserSettingsRepository userSettingsRepository;

    /**
     * 사용자 설정을 조회한다.
     *
     * @param userId 사용자 ID
     * @return 사용자 설정 DTO
     */
    public UserSettingsDto getSettings(Long userId) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return UserSettingsDto.from(settings);
    }

    /**
     * 사용자 설정을 변경한다.
     *
     * @param userId  사용자 ID
     * @param request 설정 변경 요청 DTO
     * @return 변경된 사용자 설정 DTO
     */
    @Transactional
    public UserSettingsDto updateSettings(Long userId, UserSettingsDto request) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        settings.updateAiTone(request.getAiTone());
        settings.updateAiEnabled(request.isAiEnabled());

        return UserSettingsDto.from(settings);
    }
}
