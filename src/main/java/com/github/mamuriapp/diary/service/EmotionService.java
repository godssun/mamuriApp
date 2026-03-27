package com.github.mamuriapp.diary.service;

import com.github.mamuriapp.diary.dto.EmotionRequest;
import com.github.mamuriapp.diary.dto.EmotionResponse;
import com.github.mamuriapp.diary.dto.EmotionSummaryResponse;
import com.github.mamuriapp.diary.dto.EmotionSummaryResponse.EmotionCalendarEntry;
import com.github.mamuriapp.diary.entity.Diary;
import com.github.mamuriapp.diary.entity.DiaryEmotion;
import com.github.mamuriapp.diary.repository.DiaryEmotionRepository;
import com.github.mamuriapp.diary.repository.DiaryRepository;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 감정 기록 서비스.
 */
@Service
@RequiredArgsConstructor
public class EmotionService {

    private final DiaryEmotionRepository emotionRepository;
    private final DiaryRepository diaryRepository;
    private final UserRepository userRepository;

    /**
     * 일기에 감정을 기록한다.
     */
    @Transactional
    public EmotionResponse recordEmotion(Long diaryId, Long userId, EmotionRequest request) {
        Diary diary = diaryRepository.findByIdAndUserId(diaryId, userId)
                .orElseThrow(() -> new IllegalArgumentException("일기를 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Optional<DiaryEmotion> existing = emotionRepository.findByDiaryId(diaryId);
        DiaryEmotion emotion;

        if (existing.isPresent()) {
            emotion = existing.get();
            emotion.update(request.getPrimaryEmotion(), request.getSecondaryEmotions(),
                          request.getEmotionScore());
        } else {
            emotion = DiaryEmotion.builder()
                    .diary(diary)
                    .user(user)
                    .primaryEmotion(request.getPrimaryEmotion())
                    .secondaryEmotions(request.getSecondaryEmotions())
                    .emotionScore(request.getEmotionScore())
                    .build();
        }

        return EmotionResponse.from(emotionRepository.save(emotion));
    }

    /**
     * 일기의 감정을 조회한다.
     */
    @Transactional(readOnly = true)
    public EmotionResponse getEmotion(Long diaryId) {
        return emotionRepository.findByDiaryId(diaryId)
                .map(EmotionResponse::from)
                .orElse(null);
    }

    /**
     * 주간 감정 요약을 조회한다.
     */
    @Transactional(readOnly = true)
    public EmotionSummaryResponse getWeeklySummary(Long userId) {
        LocalDateTime since = LocalDate.now().minusDays(6).atStartOfDay();
        return buildSummary(userId, since,
                LocalDate.now().minusDays(6).toString(), LocalDate.now().toString());
    }

    /**
     * 월간 감정 요약을 조회한다.
     */
    @Transactional(readOnly = true)
    public EmotionSummaryResponse getMonthlySummary(Long userId) {
        LocalDateTime since = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        return buildSummary(userId, since,
                LocalDate.now().withDayOfMonth(1).toString(), LocalDate.now().toString());
    }

    /**
     * 감정 캘린더 데이터를 조회한다 (Year in Pixels).
     */
    @Transactional(readOnly = true)
    public EmotionSummaryResponse getCalendar(Long userId, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.plusMonths(1).minusDays(1);

        List<Object[]> raw = emotionRepository.findCalendarData(
                userId, start.toString(), end.toString());

        List<EmotionCalendarEntry> calendar = raw.stream()
                .map(r -> EmotionCalendarEntry.builder()
                        .date(r[0].toString())
                        .emotion((String) r[1])
                        .score(((Number) r[2]).intValue())
                        .build())
                .collect(Collectors.toList());

        return EmotionSummaryResponse.builder()
                .calendar(calendar)
                .totalEntries(calendar.size())
                .build();
    }

    private EmotionSummaryResponse buildSummary(Long userId, LocalDateTime since,
                                                 String startDate, String endDate) {
        List<Object[]> dist = emotionRepository.countByEmotionSince(userId, since);

        Map<String, Long> emotionDist = dist.stream()
                .collect(Collectors.toMap(
                        r -> (String) r[0],
                        r -> (Long) r[1],
                        (a, b) -> a,
                        LinkedHashMap::new));

        String dominant = emotionDist.isEmpty() ? null : emotionDist.keySet().iterator().next();
        int totalEntries = emotionDist.values().stream().mapToInt(Long::intValue).sum();

        List<DiaryEmotion> emotions = emotionRepository.findByUserIdSince(userId, since);
        double avgScore = emotions.stream().mapToInt(DiaryEmotion::getEmotionScore).average().orElse(0);

        List<Object[]> calRaw = emotionRepository.findCalendarData(userId, startDate, endDate);
        List<EmotionCalendarEntry> calendar = calRaw.stream()
                .map(r -> EmotionCalendarEntry.builder()
                        .date(r[0].toString())
                        .emotion((String) r[1])
                        .score(((Number) r[2]).intValue())
                        .build())
                .collect(Collectors.toList());

        return EmotionSummaryResponse.builder()
                .emotionDistribution(emotionDist)
                .dominantEmotion(dominant)
                .totalEntries(totalEntries)
                .averageScore(Math.round(avgScore * 10.0) / 10.0)
                .calendar(calendar)
                .build();
    }
}
