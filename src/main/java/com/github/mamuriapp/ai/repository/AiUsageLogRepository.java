package com.github.mamuriapp.ai.repository;

import com.github.mamuriapp.ai.entity.AiUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * AI 사용량 로그 리포지토리.
 */
public interface AiUsageLogRepository extends JpaRepository<AiUsageLog, Long> {

    /**
     * 특정 기간의 일별 AI 사용량 요약을 조회한다 (비용 모니터링).
     *
     * @param since 조회 시작 시각
     * @return [날짜, 호출수, 총토큰, 총비용(KRW)] 목록
     */
    @Query("SELECT CAST(a.createdAt AS LocalDate), COUNT(a), SUM(a.totalTokens), SUM(a.estimatedCostKrw) " +
           "FROM AiUsageLog a WHERE a.createdAt >= :since " +
           "GROUP BY CAST(a.createdAt AS LocalDate) " +
           "ORDER BY CAST(a.createdAt AS LocalDate) DESC")
    List<Object[]> findDailyUsageSummary(@Param("since") LocalDateTime since);

    /**
     * 특정 기간의 사용자별 AI 사용량을 조회한다.
     *
     * @param since 조회 시작 시각
     * @return [사용자ID, 호출수, 총토큰, 총비용(KRW)] 목록
     */
    @Query("SELECT a.user.id, COUNT(a), SUM(a.totalTokens), SUM(a.estimatedCostKrw) " +
           "FROM AiUsageLog a WHERE a.createdAt >= :since " +
           "GROUP BY a.user.id " +
           "ORDER BY SUM(a.estimatedCostKrw) DESC")
    List<Object[]> findUserUsageSummary(@Param("since") LocalDateTime since);

    /**
     * 특정 기간의 총 비용을 조회한다.
     *
     * @param since 조회 시작 시각
     * @return 총 비용 (KRW), 기록 없으면 null
     */
    @Query("SELECT SUM(a.estimatedCostKrw) FROM AiUsageLog a WHERE a.createdAt >= :since")
    BigDecimal findTotalCostSince(@Param("since") LocalDateTime since);

    /**
     * 특정 사용자의 기간별 사용량을 조회한다.
     *
     * @param userId 사용자 ID
     * @param since  조회 시작 시각
     * @return 총 호출 수
     */
    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime since);
}

