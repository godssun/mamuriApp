package com.github.mamuriapp.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Stripe 구독 이벤트 엔티티.
 * 웹훅 멱등성을 보장하기 위해 처리된 이벤트를 기록한다.
 */
@Entity
@Table(name = "subscription_events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SubscriptionEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stripe_event_id", nullable = false, unique = true)
    private String stripeEventId;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @CreationTimestamp
    @Column(name = "processed_at", nullable = false, updatable = false)
    private LocalDateTime processedAt;

    @Builder
    public SubscriptionEvent(String stripeEventId, String eventType, User user) {
        this.stripeEventId = stripeEventId;
        this.eventType = eventType;
        this.user = user;
    }
}
