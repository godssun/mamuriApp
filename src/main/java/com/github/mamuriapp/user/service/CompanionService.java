package com.github.mamuriapp.user.service;

import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.user.dto.CompanionResponse;
import com.github.mamuriapp.user.dto.CompanionSettingsResponse;
import com.github.mamuriapp.user.dto.CompanionSettingsUpdateRequest;
import com.github.mamuriapp.user.dto.StreakResponse;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.entity.UserSettings;
import com.github.mamuriapp.user.repository.UserRepository;
import com.github.mamuriapp.user.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/**
 * AI 친구(컴패니언) 서비스.
 * AI 이름 관리, 레벨 시스템, 개인화 설정을 처리한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanionService {

    private static final Set<String> ALLOWED_TONES = Set.of("warm", "calm", "cheerful", "realistic");
    private static final Set<String> ALLOWED_SPEECH_STYLES = Set.of("formal", "casual");

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;

    /**
     * AI 친구 프로필을 조회한다.
     *
     * @param userId 사용자 ID
     * @return 컴패니언 프로필 응답
     */
    public CompanionResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        long diaryCount = user.getDiaryCount();
        int calculatedLevel = calculateLevel(diaryCount);
        int level = Math.max(calculatedLevel, user.getMaxLevel());

        if (level > user.getMaxLevel()) {
            user.updateMaxLevel(level);
        }

        return toResponse(user, level, diaryCount);
    }

    /**
     * AI 친구 이름을 변경한다.
     *
     * @param userId 사용자 ID
     * @param aiName 새로운 AI 이름
     * @return 업데이트된 컴패니언 프로필 응답
     */
    @Transactional
    public CompanionResponse updateAiName(Long userId, String aiName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        user.updateAiName(aiName);

        long diaryCount = user.getDiaryCount();
        int calculatedLevel = calculateLevel(diaryCount);
        int level = Math.max(calculatedLevel, user.getMaxLevel());

        return toResponse(user, level, diaryCount);
    }

    /**
     * 일기 개수 기반으로 레벨을 계산한다.
     *
     * @param diaryCount 일기 개수
     * @return 계산된 레벨 (1~10)
     */
    public static int calculateLevel(long diaryCount) {
        return (int) Math.min(10, diaryCount / 5 + 1);
    }

    /**
     * 다음 레벨에 필요한 총 일기 수를 반환한다.
     *
     * @param level 현재 레벨
     * @return 다음 레벨 임계값 (최대 레벨이면 -1)
     */
    public static long nextLevelThreshold(int level) {
        if (level >= 10) return -1;
        return (long) level * 5;
    }

    /**
     * 스트릭 정보를 조회한다.
     *
     * @param userId 사용자 ID
     * @return 스트릭 응답
     */
    public StreakResponse getStreak(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return new StreakResponse(
                user.getCurrentStreak(),
                user.getLongestStreak(),
                user.getLastDiaryDate()
        );
    }

    /**
     * 컴패니언 개인화 설정을 조회한다.
     *
     * @param userId 사용자 ID
     * @return 컴패니언 설정 응답
     */
    public CompanionSettingsResponse getCompanionSettings(Long userId) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return CompanionSettingsResponse.from(settings);
    }

    /**
     * 컴패니언 개인화 설정을 업데이트한다. (톤, 말투 스타일)
     *
     * @param userId  사용자 ID
     * @param request 업데이트 요청
     * @return 업데이트된 컴패니언 설정 응답
     */
    @Transactional
    public CompanionSettingsResponse updateCompanionSettings(Long userId, CompanionSettingsUpdateRequest request) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (!ALLOWED_TONES.contains(request.getAiTone())) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }
        if (!ALLOWED_SPEECH_STYLES.contains(request.getSpeechStyle())) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }

        settings.updateAiTone(request.getAiTone());
        settings.updateAiSpeechStyle(request.getSpeechStyle());

        return CompanionSettingsResponse.from(settings);
    }

    /**
     * AI 친구 프로필 사진을 업데이트한다.
     *
     * @param userId    사용자 ID
     * @param avatarUrl 저장된 이미지 URL
     * @return 업데이트된 컴패니언 설정 응답
     */
    @Transactional
    public CompanionSettingsResponse updateAvatar(Long userId, String avatarUrl) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        settings.updateAiAvatar(avatarUrl);
        return CompanionSettingsResponse.from(settings);
    }

    /**
     * AI 친구 프로필 사진을 제거한다 (기본 이모지로 복귀).
     *
     * @param userId 사용자 ID
     * @return 현재 아바타 URL (삭제용), null이면 이미 없음
     */
    @Transactional
    public String removeAvatar(Long userId) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        String oldAvatar = settings.getAiAvatar();
        settings.updateAiAvatar(null);
        return oldAvatar;
    }

    private CompanionResponse toResponse(User user, int level, long diaryCount) {
        boolean isMaxLevel = level >= 10;
        long nextThreshold = nextLevelThreshold(level);
        return new CompanionResponse(
                user.getAiName(),
                level,
                diaryCount,
                nextThreshold,
                isMaxLevel
        );
    }
}
