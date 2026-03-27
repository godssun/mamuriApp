package com.github.mamuriapp.diary.service;

import com.github.mamuriapp.diary.entity.DiaryEmotion;
import com.github.mamuriapp.diary.entity.EmotionStatistic;
import com.github.mamuriapp.diary.entity.EmotionSticker;
import com.github.mamuriapp.diary.repository.DiaryEmotionRepository;
import com.github.mamuriapp.diary.repository.EmotionStatisticRepository;
import com.github.mamuriapp.diary.repository.EmotionStickerRepository;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 감정 통계 서비스.
 * 주간/월간 감정 분포를 집계하고 조회한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmotionStatisticService {

    private final EmotionStatisticRepository statisticRepository;
    private final DiaryEmotionRepository emotionRepository;
    private final EmotionStickerRepository stickerRepository;
    private final UserRepository userRepository;

    /**
     * 매일 새벽 2시에 전날까지의 통계를 집계한다.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void aggregateDaily() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        String weekKey = getWeekKey(yesterday);
        String monthKey = getMonthKey(yesterday);

        List<User> users = userRepository.findAll();
        for (User user : users) {
            try {
                aggregateForUser(user, "WEEKLY", weekKey, getWeekStart(yesterday), yesterday);
                aggregateForUser(user, "MONTHLY", monthKey,
                        yesterday.withDayOfMonth(1), yesterday);
            } catch (Exception e) {
                log.warn("Emotion stat aggregation failed for user {}: {}",
                        user.getId(), e.getMessage());
            }
        }
    }

    /**
     * 사용자의 특정 기간 통계를 조회한다.
     */
    @Transactional(readOnly = true)
    public List<EmotionStatistic> getStatistics(Long userId, String periodType, String periodKey) {
        return statisticRepository.findByUserIdAndPeriodTypeAndPeriodKeyOrderByCountDesc(
                userId, periodType, periodKey);
    }

    /**
     * 사용자의 통계 히스토리를 조회한다.
     */
    @Transactional(readOnly = true)
    public List<EmotionStatistic> getHistory(Long userId, String periodType) {
        return statisticRepository.findByUserIdAndPeriodTypeOrderByPeriodKeyDesc(
                userId, periodType);
    }

    /**
     * 현재 주간 통계 키를 반환한다.
     */
    public String getCurrentWeekKey() {
        return getWeekKey(LocalDate.now());
    }

    /**
     * 현재 월간 통계 키를 반환한다.
     */
    public String getCurrentMonthKey() {
        return getMonthKey(LocalDate.now());
    }

    private void aggregateForUser(User user, String periodType, String periodKey,
                                   LocalDate start, LocalDate end) {
        List<DiaryEmotion> emotions = emotionRepository.findByUserIdSince(
                user.getId(), start.atStartOfDay());

        // 기간 내 감정만 필터 (endDate 포함)
        List<DiaryEmotion> filtered = emotions.stream()
                .filter(e -> {
                    LocalDate emotionDate = e.getCreatedAt().toLocalDate();
                    return !emotionDate.isAfter(end);
                })
                .toList();

        // 감정 코드별 집계 (스티커 또는 텍스트 감정)
        Map<String, List<DiaryEmotion>> grouped = filtered.stream()
                .collect(Collectors.groupingBy(e -> resolveEmotionCode(e)));

        for (Map.Entry<String, List<DiaryEmotion>> entry : grouped.entrySet()) {
            String emotionCode = entry.getKey();
            List<DiaryEmotion> group = entry.getValue();
            int count = group.size();
            double avgScore = group.stream().mapToInt(DiaryEmotion::getEmotionScore).average().orElse(0);

            Optional<EmotionStatistic> existing = statisticRepository
                    .findByUserIdAndPeriodTypeAndPeriodKeyAndEmotionCode(
                            user.getId(), periodType, periodKey, emotionCode);

            if (existing.isPresent()) {
                existing.get().updateStats(count, avgScore);
            } else {
                EmotionStatistic stat = EmotionStatistic.builder()
                        .user(user)
                        .periodType(periodType)
                        .periodKey(periodKey)
                        .emotionCode(emotionCode)
                        .count(count)
                        .avgScore(avgScore)
                        .build();
                statisticRepository.save(stat);
            }
        }
    }

    private String resolveEmotionCode(DiaryEmotion emotion) {
        // 스티커가 있으면 스티커의 카테고리 코드 사용
        if (emotion.getPrimaryStickerId() != null) {
            return stickerRepository.findById(emotion.getPrimaryStickerId())
                    .map(s -> s.getCategory().getCode())
                    .orElse(emotion.getPrimaryEmotion() != null ? emotion.getPrimaryEmotion() : "UNKNOWN");
        }
        return emotion.getPrimaryEmotion() != null ? emotion.getPrimaryEmotion() : "UNKNOWN";
    }

    private String getWeekKey(LocalDate date) {
        int weekNumber = date.get(WeekFields.ISO.weekOfWeekBasedYear());
        int year = date.get(WeekFields.ISO.weekBasedYear());
        return String.format("%d-W%02d", year, weekNumber);
    }

    private String getMonthKey(LocalDate date) {
        return String.format("%d-%02d", date.getYear(), date.getMonthValue());
    }

    private LocalDate getWeekStart(LocalDate date) {
        return date.with(DayOfWeek.MONDAY);
    }
}
