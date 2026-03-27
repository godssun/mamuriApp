package com.github.mamuriapp.diary.repository;

import com.github.mamuriapp.diary.entity.DiaryEmotion;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 일기 감정 리포지토리.
 */
public interface DiaryEmotionRepository extends JpaRepository<DiaryEmotion, Long> {

    Optional<DiaryEmotion> findByDiaryId(Long diaryId);

    /**
     * 여러 일기의 감정을 배치 조회한다.
     */
    @Query("SELECT de FROM DiaryEmotion de WHERE de.diary.id IN :diaryIds")
    List<DiaryEmotion> findByDiaryIds(@Param("diaryIds") List<Long> diaryIds);

    /**
     * 사용자의 특정 기간 감정 목록을 조회한다.
     */
    @Query("SELECT de FROM DiaryEmotion de WHERE de.user.id = :userId " +
           "AND de.createdAt >= :since ORDER BY de.createdAt DESC")
    List<DiaryEmotion> findByUserIdSince(@Param("userId") Long userId,
                                          @Param("since") LocalDateTime since);

    /**
     * 사용자의 특정 기간 감정 분포를 조회한다.
     */
    @Query("SELECT de.primaryEmotion, COUNT(de) FROM DiaryEmotion de " +
           "WHERE de.user.id = :userId AND de.createdAt >= :since " +
           "GROUP BY de.primaryEmotion ORDER BY COUNT(de) DESC")
    List<Object[]> countByEmotionSince(@Param("userId") Long userId,
                                        @Param("since") LocalDateTime since);

    /**
     * 사용자의 최근 N개 감정을 조회한다 (AI 프롬프트 컨텍스트용).
     */
    @Query("SELECT de FROM DiaryEmotion de WHERE de.user.id = :userId " +
           "ORDER BY de.createdAt DESC")
    List<DiaryEmotion> findRecentByUserId(@Param("userId") Long userId, Pageable pageable);

    /**
     * 감정 캘린더용: 특정 기간의 일별 감정 데이터.
     */
    @Query(value = "SELECT d.diary_date, de.primary_emotion, de.emotion_score " +
           "FROM diary_emotions de JOIN diaries d ON de.diary_id = d.id " +
           "WHERE de.user_id = :userId " +
           "AND d.diary_date >= CAST(:startDate AS DATE) AND d.diary_date <= CAST(:endDate AS DATE) " +
           "ORDER BY d.diary_date", nativeQuery = true)
    List<Object[]> findCalendarData(@Param("userId") Long userId,
                                     @Param("startDate") String startDate,
                                     @Param("endDate") String endDate);

    /**
     * 캘린더 v2: 스티커 정보를 포함한 캘린더 데이터.
     */
    @Query(value = "SELECT d.diary_date, d.id AS diary_id, de.primary_emotion, de.emotion_score, " +
           "de.primary_sticker_id, es.code AS sticker_code, es.image_url AS sticker_image_url, " +
           "ec.color_hex AS category_color_hex " +
           "FROM diary_emotions de " +
           "JOIN diaries d ON de.diary_id = d.id " +
           "LEFT JOIN emotion_stickers es ON de.primary_sticker_id = es.id " +
           "LEFT JOIN emotion_categories ec ON es.category_id = ec.id " +
           "WHERE de.user_id = :userId " +
           "AND d.diary_date >= CAST(:startDate AS DATE) AND d.diary_date <= CAST(:endDate AS DATE) " +
           "ORDER BY d.diary_date", nativeQuery = true)
    List<Object[]> findCalendarDataWithSticker(@Param("userId") Long userId,
                                                @Param("startDate") String startDate,
                                                @Param("endDate") String endDate);
}
