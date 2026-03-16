package com.github.mamuriapp.user.repository;

import com.github.mamuriapp.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

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
}
