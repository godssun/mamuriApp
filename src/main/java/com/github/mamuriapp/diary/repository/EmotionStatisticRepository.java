package com.github.mamuriapp.diary.repository;

import com.github.mamuriapp.diary.entity.EmotionStatistic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 감정 통계 리포지토리.
 */
public interface EmotionStatisticRepository extends JpaRepository<EmotionStatistic, Long> {

    List<EmotionStatistic> findByUserIdAndPeriodTypeAndPeriodKeyOrderByCountDesc(
            Long userId, String periodType, String periodKey);

    Optional<EmotionStatistic> findByUserIdAndPeriodTypeAndPeriodKeyAndEmotionCode(
            Long userId, String periodType, String periodKey, String emotionCode);

    List<EmotionStatistic> findByUserIdAndPeriodTypeOrderByPeriodKeyDesc(
            Long userId, String periodType);
}
