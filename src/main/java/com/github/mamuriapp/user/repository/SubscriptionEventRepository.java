package com.github.mamuriapp.user.repository;

import com.github.mamuriapp.user.entity.SubscriptionEvent;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 구독 이벤트 리포지토리.
 */
public interface SubscriptionEventRepository extends JpaRepository<SubscriptionEvent, Long> {

    /**
     * Stripe 이벤트 ID로 처리 여부를 확인한다 (멱등성).
     *
     * @param stripeEventId Stripe 이벤트 ID
     * @return 이미 처리되었으면 true
     */
    boolean existsByStripeEventId(String stripeEventId);
}
