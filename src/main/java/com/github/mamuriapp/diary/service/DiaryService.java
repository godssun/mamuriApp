package com.github.mamuriapp.diary.service;

import com.github.mamuriapp.ai.dto.AiCommentResponse;
import com.github.mamuriapp.ai.service.AiCommentService;
import com.github.mamuriapp.diary.dto.DiaryCalendarResponse;
import com.github.mamuriapp.diary.dto.DiaryCreateRequest;
import com.github.mamuriapp.diary.dto.DiaryResponse;
import com.github.mamuriapp.diary.dto.DiaryUpdateRequest;
import com.github.mamuriapp.diary.entity.Diary;
import com.github.mamuriapp.diary.repository.DiaryRepository;
import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
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

    private final DiaryRepository diaryRepository;
    private final UserRepository userRepository;
    private final AiCommentService aiCommentService;

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

        LocalDate diaryDate = request.getDiaryDate() != null
                ? request.getDiaryDate()
                : LocalDate.now();

        Diary diary = Diary.builder()
                .user(user)
                .title(request.getTitle())
                .content(request.getContent())
                .diaryDate(diaryDate)
                .build();
        diaryRepository.save(diary);

        AiCommentResponse aiComment = null;
        try {
            aiComment = aiCommentService.generateComment(diary);
        } catch (Exception e) {
            log.warn("AI 코멘트 생성 실패 (diaryId={}): {}", diary.getId(), e.getMessage());
        }

        return DiaryResponse.of(diary, aiComment);
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
     * 일기 상세를 조회한다.
     *
     * @param userId  사용자 ID
     * @param diaryId 일기 ID
     * @return 일기 응답 (AI 코멘트 포함)
     */
    public DiaryResponse getDetail(Long userId, Long diaryId) {
        Diary diary = findUserDiary(userId, diaryId);
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
        diaryRepository.delete(diary);
    }

    private Diary findUserDiary(Long userId, Long diaryId) {
        return diaryRepository.findByIdAndUserId(diaryId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.DIARY_NOT_FOUND));
    }
}
