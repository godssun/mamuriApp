package com.github.mamuriapp.diary.service;

import com.github.mamuriapp.ai.dto.AiCommentResponse;
import com.github.mamuriapp.ai.service.AiCommentService;
import com.github.mamuriapp.ai.service.MemoryExtractionService;
import com.github.mamuriapp.ai.service.SafetyCheckService;
import com.github.mamuriapp.diary.dto.*;
import com.github.mamuriapp.diary.entity.Diary;
import com.github.mamuriapp.diary.entity.DiaryEmotion;
import com.github.mamuriapp.diary.entity.EmotionSticker;
import com.github.mamuriapp.diary.repository.DiaryEmotionRepository;
import com.github.mamuriapp.diary.repository.DiaryRepository;
import com.github.mamuriapp.diary.repository.EmotionStickerRepository;
import com.github.mamuriapp.global.config.FeatureFlags;
import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.repository.UserRepository;
import com.github.mamuriapp.user.service.CompanionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;

/**
 * 일기 서비스.
 * 일기 CRUD 및 AI 코멘트 연동을 처리한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiaryService {

    private static final int FREE_MONTHLY_QUOTA = 20;

    private final DiaryRepository diaryRepository;
    private final UserRepository userRepository;
    private final AiCommentService aiCommentService;
    private final SafetyCheckService safetyCheckService;
    private final CompanionService companionService;
    private final MemoryExtractionService memoryExtractionService;
    private final DiaryEmotionRepository diaryEmotionRepository;
    private final EmotionStickerRepository emotionStickerRepository;
    private final FeatureFlags featureFlags;

    /**
     * 새로운 일기를 작성한다.
     * 저장 후 AI 코멘트를 자동 생성하되, AI 실패 시에도 일기는 정상 저장된다.
     *
     * @param userId  작성자 ID
     * @param request 일기 작성 요청
     * @return 작성된 일기 응답 (AI 코멘트 포함 가능)
     */
    @Transactional
    public DiaryResponse create(Long userId, DiaryCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        int oldLevel = user.getMaxLevel();

        LocalDate todayKst = LocalDate.now(ZoneId.of("Asia/Seoul"));
        LocalDate diaryDate = request.getDiaryDate() != null
                ? request.getDiaryDate()
                : todayKst;

        if (diaryDate.isAfter(todayKst)) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }

        Diary diary = Diary.builder()
                .user(user)
                .title(request.getTitle())
                .content(request.getContent())
                .diaryDate(diaryDate)
                .diaryType(request.getDiaryType())
                .theme(request.getTheme())
                .build();
        diaryRepository.save(diary);
        user.incrementDiaryCount();

        // 1. SafetyCheck (항상 먼저)
        boolean isSafe = safetyCheckService.check(diary);
        if (!isSafe) {
            user.setCrisisFlag();
        }

        // 2. QuotaCheck (Feature Flag ON + 비프리미엄 + 비위기 사용자만)
        if (featureFlags.isQuotaEnforcementEnabled()
                && !user.isPremium()
                && !user.hasCrisisFlag()) {
            // Lazy Reset: quotaResetDate가 과거이면 자동 리셋
            if (user.getQuotaResetDate() != null
                    && user.getQuotaResetDate().isBefore(LocalDate.now())) {
                user.resetQuota();
            }
            if (user.getQuotaUsed() >= FREE_MONTHLY_QUOTA) {
                throw new CustomException(ErrorCode.QUOTA_EXCEEDED);
            }
        }

        // 스트릭 업데이트
        user.updateStreak(diaryDate);

        // 레벨업 감지
        int newLevel = CompanionService.calculateLevel(user.getDiaryCount());
        DiaryResponse.LevelUpInfo levelUpInfo = null;

        if (newLevel > oldLevel) {
            user.updateMaxLevel(newLevel);
            levelUpInfo = new DiaryResponse.LevelUpInfo(oldLevel, newLevel);
        }

        // 3. AI 코멘트 생성
        AiCommentResponse aiComment = null;
        try {
            aiComment = aiCommentService.generateComment(diary, user, isSafe);

            // AI 성공 후에만 쿼터 증가 (비프리미엄, 비위기 사용자)
            if (aiComment != null
                    && featureFlags.isQuotaEnforcementEnabled()
                    && !user.isPremium()
                    && !user.hasCrisisFlag()) {
                user.incrementQuotaUsed();
            }
        } catch (Exception e) {
            log.warn("AI 코멘트 생성 실패 (diaryId={}): {}", diary.getId(), e.getMessage());
        }

        // 4. 감정 저장 (감정 텍스트 또는 스티커 ID가 있는 경우)
        boolean hasEmotion = (request.getPrimaryEmotion() != null && !request.getPrimaryEmotion().isBlank());
        boolean hasSticker = (request.getPrimaryStickerId() != null);
        if (hasEmotion || hasSticker) {
            try {
                DiaryEmotion emotion = DiaryEmotion.builder()
                        .diary(diary)
                        .user(user)
                        .primaryEmotion(request.getPrimaryEmotion())
                        .secondaryEmotions(request.getSecondaryEmotions())
                        .emotionScore(request.getEmotionScore() != null ? request.getEmotionScore() : 3)
                        .primaryStickerId(request.getPrimaryStickerId())
                        .secondaryStickerIds(request.getSecondaryStickerIds())
                        .build();
                diaryEmotionRepository.save(emotion);
            } catch (Exception e) {
                log.warn("Emotion save failed for diary {}: {}", diary.getId(), e.getMessage());
            }
        }

        // 5. 기억 추출 (비동기)
        memoryExtractionService.extractMemories(diary, user);

        // 6. 마지막 활동 시간 업데이트
        user.updateLastActive();

        DiaryResponse.StreakInfo streakInfo = new DiaryResponse.StreakInfo(
                user.getCurrentStreak(), user.getLongestStreak(),
                user.getLastDiaryDate() != null && user.getLastDiaryDate().equals(diaryDate)
        );
        return DiaryResponse.of(diary, aiComment, levelUpInfo, streakInfo);
    }

    /**
     * 사용자의 일기 목록을 일기 날짜 기준으로 조회한다.
     *
     * @param userId 사용자 ID
     * @return 일기 응답 목록
     */
    public List<DiaryResponse> getList(Long userId) {
        return diaryRepository.findByUserIdOrderByDiaryDateDescCreatedAtDesc(userId).stream()
                .map(DiaryResponse::from)
                .toList();
    }

    /**
     * 사용자의 특정 월 일기 목록을 조회한다.
     *
     * @param userId 사용자 ID
     * @param year   연도
     * @param month  월
     * @return 일기 응답 목록
     */
    public List<DiaryResponse> getListByMonth(Long userId, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        return diaryRepository.findByUserIdAndDiaryDateBetween(userId, startDate, endDate).stream()
                .map(DiaryResponse::from)
                .toList();
    }

    /**
     * 캘린더용 일기가 있는 날짜 목록을 조회한다.
     *
     * @param userId 사용자 ID
     * @param year   연도
     * @param month  월
     * @return 캘린더 응답
     */
    public DiaryCalendarResponse getCalendar(Long userId, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        List<LocalDate> dates = diaryRepository.findDiaryDatesByUserIdAndPeriod(
                userId, startDate, endDate);

        return DiaryCalendarResponse.of(year, month, dates);
    }

    /**
     * 사용자의 특정 날짜 일기 목록을 조회한다.
     *
     * @param userId 사용자 ID
     * @param date   조회 날짜
     * @return 일기 응답 목록
     */
    public List<DiaryResponse> getListByDate(Long userId, LocalDate date) {
        return diaryRepository.findByUserIdAndDiaryDate(userId, date).stream()
                .map(DiaryResponse::from)
                .toList();
    }

    /**
     * 일기 상세를 조회한다.
     * JOIN FETCH로 User를 즉시 로딩하여 추가 쿼리를 방지한다.
     *
     * @param userId  사용자 ID
     * @param diaryId 일기 ID
     * @return 일기 응답 (AI 코멘트 포함)
     */
    public DiaryResponse getDetail(Long userId, Long diaryId) {
        Diary diary = diaryRepository.findByIdAndUserIdWithUser(diaryId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.DIARY_NOT_FOUND));
        AiCommentResponse aiComment = aiCommentService.getComment(diaryId);
        return DiaryResponse.of(diary, aiComment);
    }

    /**
     * 일기를 수정한다.
     *
     * @param userId  사용자 ID
     * @param diaryId 일기 ID
     * @param request 일기 수정 요청
     * @return 수정된 일기 응답
     */
    @Transactional
    public DiaryResponse update(Long userId, Long diaryId, DiaryUpdateRequest request) {
        Diary diary = findUserDiary(userId, diaryId);
        diary.update(request.getTitle(), request.getContent(), request.getDiaryDate());
        return DiaryResponse.from(diary);
    }

    /**
     * 일기를 삭제한다.
     *
     * @param userId  사용자 ID
     * @param diaryId 일기 ID
     */
    @Transactional
    public void delete(Long userId, Long diaryId) {
        Diary diary = findUserDiary(userId, diaryId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        user.decrementDiaryCount();

        LocalDate deletedDate = diary.getDiaryDate();
        diaryRepository.delete(diary);

        // 스트릭 재계산: 삭제된 일기가 lastDiaryDate와 같으면
        if (deletedDate.equals(user.getLastDiaryDate())) {
            recalculateStreak(user);
        }
    }

    private void recalculateStreak(User user) {
        List<Diary> recentDiaries = diaryRepository.findTop10ByUserIdOrderByDiaryDateDesc(user.getId());
        if (recentDiaries.isEmpty()) {
            user.resetStreakData();
            return;
        }

        // 가장 최근 일기 날짜부터 연속성 체크
        LocalDate lastDate = recentDiaries.get(0).getDiaryDate();
        int streak = 1;

        for (int i = 1; i < recentDiaries.size(); i++) {
            LocalDate currentDate = recentDiaries.get(i).getDiaryDate();
            if (currentDate.equals(lastDate)) continue; // 같은 날 일기
            if (currentDate.equals(lastDate.minusDays(1))) {
                streak++;
                lastDate = currentDate;
            } else {
                break;
            }
        }

        user.setStreakData(streak, recentDiaries.get(0).getDiaryDate());
    }

    /**
     * 캘린더 v2: 스티커 정보를 포함한 캘린더 데이터를 조회한다.
     */
    public List<CalendarDayEntry> getCalendarV2(Long userId, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        List<Object[]> raw = diaryEmotionRepository.findCalendarDataWithSticker(
                userId, startDate.toString(), endDate.toString());

        return raw.stream()
                .map(r -> CalendarDayEntry.builder()
                        .date(LocalDate.parse(r[0].toString()))
                        .diaryId(r[1] != null ? ((Number) r[1]).longValue() : null)
                        .primaryEmotion(r[2] != null ? (String) r[2] : null)
                        .emotionScore(r[3] != null ? ((Number) r[3]).intValue() : 0)
                        .primaryStickerId(r[4] != null ? ((Number) r[4]).longValue() : null)
                        .stickerCode(r[5] != null ? (String) r[5] : null)
                        .stickerImageUrl(r[6] != null ? (String) r[6] : null)
                        .categoryColorHex(r[7] != null ? (String) r[7] : null)
                        .build())
                .toList();
    }

    private Diary findUserDiary(Long userId, Long diaryId) {
        return diaryRepository.findByIdAndUserId(diaryId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.DIARY_NOT_FOUND));
    }
}
