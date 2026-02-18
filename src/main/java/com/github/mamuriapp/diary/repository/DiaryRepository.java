package com.github.mamuriapp.diary.repository;

import com.github.mamuriapp.diary.entity.Diary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 일기 리포지토리.
 */
public interface DiaryRepository extends JpaRepository<Diary, Long> {

    /**
     * 사용자의 일기 목록을 최신순으로 조회한다.
     *
     * @param userId 사용자 ID
     * @return 일기 목록
     */
    List<Diary> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * 사용자의 특정 일기를 조회한다.
     *
     * @param id     일기 ID
     * @param userId 사용자 ID
     * @return 일기 Optional
     */
    Optional<Diary> findByIdAndUserId(Long id, Long userId);

    /**
     * 사용자의 일기 목록을 일기 날짜 기준 최신순으로 조회한다.
     *
     * @param userId 사용자 ID
     * @return 일기 목록
     */
    List<Diary> findByUserIdOrderByDiaryDateDescCreatedAtDesc(Long userId);

    /**
     * 사용자의 특정 기간 일기 목록을 조회한다.
     *
     * @param userId    사용자 ID
     * @param startDate 시작 날짜 (포함)
     * @param endDate   종료 날짜 (포함)
     * @return 일기 목록
     */
    @Query("SELECT d FROM Diary d WHERE d.user.id = :userId " +
           "AND d.diaryDate >= :startDate AND d.diaryDate <= :endDate " +
           "ORDER BY d.diaryDate DESC, d.createdAt DESC")
    List<Diary> findByUserIdAndDiaryDateBetween(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * 사용자의 특정 기간 내 일기가 있는 날짜 목록을 조회한다 (캘린더용).
     *
     * @param userId    사용자 ID
     * @param startDate 시작 날짜
     * @param endDate   종료 날짜
     * @return 일기가 있는 날짜 목록
     */
    @Query("SELECT DISTINCT d.diaryDate FROM Diary d WHERE d.user.id = :userId " +
           "AND d.diaryDate >= :startDate AND d.diaryDate <= :endDate " +
           "ORDER BY d.diaryDate")
    List<LocalDate> findDiaryDatesByUserIdAndPeriod(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * 사용자의 특정 날짜 일기 목록을 조회한다.
     *
     * @param userId 사용자 ID
     * @param date   조회 날짜
     * @return 일기 목록
     */
    @Query("SELECT d FROM Diary d WHERE d.user.id = :userId " +
           "AND d.diaryDate = :date " +
           "ORDER BY d.createdAt DESC")
    List<Diary> findByUserIdAndDiaryDate(
            @Param("userId") Long userId,
            @Param("date") LocalDate date);

    long countByUserId(Long userId);
}
