package com.github.mamuriapp.user.repository;

import com.github.mamuriapp.user.entity.PushToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

/**
 * 푸시 토큰 리포지토리.
 */
public interface PushTokenRepository extends JpaRepository<PushToken, Long> {

    Optional<PushToken> findByUserIdAndToken(Long userId, String token);

    List<PushToken> findByUserIdAndEnabled(Long userId, boolean enabled);

    @Query("SELECT p FROM PushToken p WHERE p.enabled = true AND p.user.id = :userId")
    List<PushToken> findActiveByUserId(Long userId);

    /**
     * 알림 대상 사용자 토큰 조회 (마지막 활동이 N시간 전인 사용자).
     */
    @Query(value = "SELECT p.* FROM push_tokens p JOIN users u ON p.user_id = u.id " +
           "WHERE p.enabled = true " +
           "AND (u.last_active_at IS NULL OR u.last_active_at < NOW() - CAST(:hoursAgo || ' hours' AS INTERVAL))",
           nativeQuery = true)
    List<PushToken> findInactiveUserTokens(int hoursAgo);
}
