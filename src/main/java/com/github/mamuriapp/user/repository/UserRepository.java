package com.github.mamuriapp.user.repository;

import com.github.mamuriapp.user.entity.SubscriptionStatus;
import com.github.mamuriapp.user.entity.SubscriptionTier;
import com.github.mamuriapp.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 사용자 리포지토리.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * 이메일로 사용자를 조회한다.
     *
     * @param email 사용자 이메일
     * @return 사용자 Optional
     */
    Optional<User> findByEmail(String email);

    /**
     * 이메일 존재 여부를 확인한다.
     *
     * @param email 확인할 이메일
     * @return 존재하면 true
     */
    boolean existsByEmail(String email);

    /**
     * Stripe 고객 ID로 사용자를 조회한다.
     *
     * @param stripeCustomerId Stripe 고객 ID
     * @return 사용자 Optional
     */
    Optional<User> findByStripeCustomerId(String stripeCustomerId);

    /**
     * 전체 사용자의 AI 쿼터를 벌크 리셋한다.
     *
     * @return 업데이트된 행 수
     */
    @Modifying
    @Query("UPDATE User u SET u.quotaUsed = 0, u.quotaResetDate = CURRENT_DATE")
    int bulkResetQuota();

    // --- Admin 쿼리 ---

    /**
     * 특정 시각 이후 가입한 사용자 수를 조회한다.
     */
    long countByCreatedAtAfter(LocalDateTime since);

    /**
     * 구독 상태별 사용자 수를 조회한다.
     */
    @Query("SELECT u.subscriptionStatus, COUNT(u) FROM User u GROUP BY u.subscriptionStatus")
    List<Object[]> countBySubscriptionStatus();

    /**
     * 구독 티어별 사용자 수를 조회한다.
     */
    @Query("SELECT u.subscriptionTier, COUNT(u) FROM User u GROUP BY u.subscriptionTier")
    List<Object[]> countBySubscriptionTier();

    /**
     * 인증 프로바이더별 사용자 수를 조회한다.
     */
    @Query("SELECT u.authProvider, COUNT(u) FROM User u GROUP BY u.authProvider")
    List<Object[]> countByAuthProvider();

    /**
     * 일별 신규 가입자 수를 조회한다.
     */
    @Query("SELECT CAST(u.createdAt AS LocalDate), COUNT(u) FROM User u " +
           "WHERE u.createdAt >= :since " +
           "GROUP BY CAST(u.createdAt AS LocalDate) " +
           "ORDER BY CAST(u.createdAt AS LocalDate)")
    List<Object[]> findDailySignups(@Param("since") LocalDateTime since);

    /**
     * 특정 기간 내 일기를 작성한 고유 사용자 수를 조회한다 (활동 기반 DAU/MAU).
     */
    @Query("SELECT COUNT(DISTINCT d.user.id) FROM Diary d " +
           "WHERE d.createdAt >= :since")
    long countActiveWritersSince(@Param("since") LocalDateTime since);

    /**
     * 일별 활성 사용자 수 (일기 작성 기준) 를 조회한다.
     */
    @Query("SELECT CAST(d.createdAt AS LocalDate), COUNT(DISTINCT d.user.id) " +
           "FROM Diary d WHERE d.createdAt >= :since " +
           "GROUP BY CAST(d.createdAt AS LocalDate) " +
           "ORDER BY CAST(d.createdAt AS LocalDate)")
    List<Object[]> findDailyActiveUsers(@Param("since") LocalDateTime since);

    /**
     * 평균 스트릭 통계를 조회한다.
     */
    // 반환 타입을 Object[]로 선언하면 단일 행이 Object[]{Object[]{...}}로 중첩되어
    // 호출부 캐스팅이 ClassCastException을 던진다. List로 받아 첫 행을 사용할 것.
    @Query("SELECT AVG(u.currentStreak), MAX(u.currentStreak), AVG(u.longestStreak) FROM User u")
    List<Object[]> findStreakStats();

    /**
     * 검색/필터 가능한 사용자 목록을 페이징 조회한다.
     */
    @Query("SELECT u FROM User u WHERE " +
           "(:keyword IS NULL OR u.email LIKE %:keyword% OR u.nickname LIKE %:keyword%) " +
           "AND (:tier IS NULL OR u.subscriptionTier = :tier) " +
           "AND (:status IS NULL OR u.subscriptionStatus = :status)")
    Page<User> findByFilters(
            @Param("keyword") String keyword,
            @Param("tier") SubscriptionTier tier,
            @Param("status") SubscriptionStatus status,
            Pageable pageable);

    /**
     * 리텐션 분석: 가입 후 특정 기간 내 일기를 작성한 사용자 비율.
     * 특정 기간에 가입한 사용자 중, 가입 후 N시간 내 일기를 1건 이상 작성한 사용자 수.
     */
    @Query(value = "SELECT COUNT(DISTINCT u.id) FROM users u " +
           "JOIN diaries d ON d.user_id = u.id " +
           "WHERE u.created_at >= :cohortStart AND u.created_at < :cohortEnd " +
           "AND d.created_at >= u.created_at " +
           "AND d.created_at < u.created_at + CAST(:hoursAfter || ' hours' AS INTERVAL)",
           nativeQuery = true)
    long countRetainedUsers(
            @Param("cohortStart") LocalDateTime cohortStart,
            @Param("cohortEnd") LocalDateTime cohortEnd,
            @Param("hoursAfter") int hoursAfter);

    /**
     * 특정 기간에 가입한 사용자 수.
     */
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
