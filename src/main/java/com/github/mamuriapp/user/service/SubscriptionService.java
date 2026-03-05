package com.github.mamuriapp.user.service;

import com.github.mamuriapp.global.config.StripeProperties;
import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.user.dto.SubscriptionStatusResponse;
import com.github.mamuriapp.user.entity.SubscriptionEvent;
import com.github.mamuriapp.user.entity.SubscriptionStatus;
import com.github.mamuriapp.user.entity.SubscriptionTier;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.repository.SubscriptionEventRepository;
import com.github.mamuriapp.user.repository.UserRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.param.SubscriptionCancelParams;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * 구독 서비스.
 * Stripe 연동을 통한 멀티 플랜(Deluxe/Premium) 구독 관리와 웹훅 처리를 담당한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final UserRepository userRepository;
    private final SubscriptionEventRepository subscriptionEventRepository;
    private final StripeProperties stripeProperties;

    /**
     * Stripe Checkout Session을 생성한다.
     * 신규 가입자에게는 7일 무료 체험을 제공한다.
     *
     * @param userId  사용자 ID
     * @param priceId Stripe Price ID
     * @return Checkout URL
     */
    public String createCheckoutSession(Long userId, String priceId) {
        User user = findUser(userId);

        try {
            SessionCreateParams.Builder builder = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                    .setSuccessUrl("mamuri://subscription/success")
                    .setCancelUrl("mamuri://subscription/cancel")
                    .addLineItem(SessionCreateParams.LineItem.builder()
                            .setPrice(priceId)
                            .setQuantity(1L)
                            .build())
                    .putMetadata("userId", String.valueOf(userId));

            // 신규 가입자 → 7일 무료 체험
            if (user.getStripeSubscriptionId() == null && user.getTrialEnd() == null) {
                builder.setSubscriptionData(
                        SessionCreateParams.SubscriptionData.builder()
                                .setTrialPeriodDays(7L)
                                .build());
            }

            if (user.getStripeCustomerId() != null) {
                builder.setCustomer(user.getStripeCustomerId());
            } else {
                builder.setCustomerEmail(user.getEmail());
            }

            Session session = Session.create(builder.build());
            return session.getUrl();
        } catch (StripeException e) {
            log.error("[Stripe] Checkout Session 생성 실패: {}", e.getMessage(), e);
            throw new CustomException(ErrorCode.INTERNAL_ERROR);
        }
    }

    /**
     * 사용자의 구독 상태를 조회한다.
     *
     * @param userId 사용자 ID
     * @return 구독 상태 응답
     */
    @Transactional(readOnly = true)
    public SubscriptionStatusResponse getSubscriptionStatus(Long userId) {
        User user = findUser(userId);
        return SubscriptionStatusResponse.from(user);
    }

    /**
     * 구독을 취소한다.
     *
     * @param userId 사용자 ID
     */
    @Transactional
    public void cancelSubscription(Long userId) {
        User user = findUser(userId);

        if (user.getStripeSubscriptionId() == null) {
            log.warn("[Stripe] 취소 요청: 구독 ID 없음 (userId={})", userId);
            return;
        }

        try {
            Subscription subscription = Subscription.retrieve(user.getStripeSubscriptionId());
            subscription.cancel(SubscriptionCancelParams.builder().build());
            log.info("[Stripe] 구독 취소 완료 (userId={}, subId={})",
                    userId, user.getStripeSubscriptionId());
        } catch (StripeException e) {
            log.error("[Stripe] 구독 취소 실패: {}", e.getMessage(), e);
            throw new CustomException(ErrorCode.INTERNAL_ERROR);
        }
    }

    /**
     * Stripe 웹훅 이벤트를 처리한다 (멱등성 보장).
     *
     * @param event Stripe Event
     */
    @Transactional
    public void handleWebhookEvent(Event event) {
        String eventId = event.getId();
        String eventType = event.getType();

        // 멱등성 체크
        if (subscriptionEventRepository.existsByStripeEventId(eventId)) {
            log.info("[Stripe] 중복 이벤트 무시: {}", eventId);
            return;
        }

        log.info("[Stripe] 웹훅 이벤트 수신: type={}, id={}", eventType, eventId);

        switch (eventType) {
            case "customer.subscription.created",
                 "customer.subscription.updated" -> handleSubscriptionUpdate(event);
            case "customer.subscription.deleted" -> handleSubscriptionDeleted(event);
            case "invoice.payment_failed" -> handlePaymentFailed(event);
            default -> log.info("[Stripe] 미처리 이벤트 타입: {}", eventType);
        }
    }

    private void handleSubscriptionUpdate(Event event) {
        Subscription subscription = extractSubscription(event);
        if (subscription == null) return;

        String customerId = subscription.getCustomer();
        User user = userRepository.findByStripeCustomerId(customerId).orElse(null);
        if (user == null) {
            log.warn("[Stripe] 사용자 찾을 수 없음: customerId={}", customerId);
            return;
        }

        SubscriptionStatus status = mapStripeStatus(subscription.getStatus());
        LocalDateTime periodEnd = toLocalDateTime(subscription.getCurrentPeriodEnd());

        user.updateSubscription(status, periodEnd);
        user.updateStripeSubscriptionId(subscription.getId());

        // Price ID 기반으로 티어 결정
        SubscriptionTier tier = determineTierFromSubscription(subscription);
        user.updateSubscriptionTier(tier);

        // Trial 시작 기록
        if (status == SubscriptionStatus.TRIALING && user.getTrialStart() == null) {
            user.startTrial();
        }

        recordEvent(event, user);
        log.info("[Stripe] 구독 상태 업데이트: userId={}, status={}, tier={}",
                user.getId(), status, tier);
    }

    private void handleSubscriptionDeleted(Event event) {
        Subscription subscription = extractSubscription(event);
        if (subscription == null) return;

        String customerId = subscription.getCustomer();
        User user = userRepository.findByStripeCustomerId(customerId).orElse(null);
        if (user == null) return;

        user.updateSubscription(SubscriptionStatus.CANCELED, null);
        user.updateSubscriptionTier(SubscriptionTier.FREE);

        recordEvent(event, user);
        log.info("[Stripe] 구독 취소됨: userId={}", user.getId());
    }

    private void handlePaymentFailed(Event event) {
        String customerId = extractCustomerIdFromInvoice(event);
        if (customerId == null) return;

        User user = userRepository.findByStripeCustomerId(customerId).orElse(null);
        if (user == null) return;

        user.updateSubscription(SubscriptionStatus.PAST_DUE, user.getCurrentPeriodEnd());
        user.updateGracePeriodEnd(LocalDateTime.now().plusDays(3));

        recordEvent(event, user);
        log.info("[Stripe] 결제 실패 → PAST_DUE: userId={}", user.getId());
    }

    /**
     * Stripe Subscription의 Price ID를 기반으로 구독 티어를 결정한다.
     */
    private SubscriptionTier determineTierFromSubscription(Subscription subscription) {
        try {
            if (subscription.getItems() != null && subscription.getItems().getData() != null
                    && !subscription.getItems().getData().isEmpty()) {
                String priceId = subscription.getItems().getData().get(0).getPrice().getId();
                if (stripeProperties.isPremiumPrice(priceId)) {
                    return SubscriptionTier.PREMIUM;
                }
                if (stripeProperties.isDeluxePrice(priceId)) {
                    return SubscriptionTier.DELUXE;
                }
            }
        } catch (Exception e) {
            log.warn("[Stripe] Price ID 기반 티어 결정 실패: {}", e.getMessage());
        }
        // 기본: DELUXE
        return SubscriptionTier.DELUXE;
    }

    private Subscription extractSubscription(Event event) {
        try {
            if (event.getDataObjectDeserializer().getObject().isPresent()) {
                return (Subscription) event.getDataObjectDeserializer().getObject().get();
            }
        } catch (Exception e) {
            log.error("[Stripe] 구독 객체 추출 실패: {}", e.getMessage());
        }
        return null;
    }

    private String extractCustomerIdFromInvoice(Event event) {
        try {
            if (event.getDataObjectDeserializer().getObject().isPresent()) {
                com.stripe.model.Invoice invoice =
                        (com.stripe.model.Invoice) event.getDataObjectDeserializer().getObject().get();
                return invoice.getCustomer();
            }
        } catch (Exception e) {
            log.error("[Stripe] Invoice 고객 ID 추출 실패: {}", e.getMessage());
        }
        return null;
    }

    private SubscriptionStatus mapStripeStatus(String stripeStatus) {
        return switch (stripeStatus) {
            case "active" -> SubscriptionStatus.ACTIVE;
            case "trialing" -> SubscriptionStatus.TRIALING;
            case "past_due" -> SubscriptionStatus.PAST_DUE;
            case "canceled", "unpaid", "incomplete_expired" -> SubscriptionStatus.CANCELED;
            default -> SubscriptionStatus.FREE;
        };
    }

    private LocalDateTime toLocalDateTime(Long epochSeconds) {
        if (epochSeconds == null) return null;
        return Instant.ofEpochSecond(epochSeconds)
                .atZone(ZoneId.of("Asia/Seoul"))
                .toLocalDateTime();
    }

    private void recordEvent(Event event, User user) {
        SubscriptionEvent subscriptionEvent = SubscriptionEvent.builder()
                .stripeEventId(event.getId())
                .eventType(event.getType())
                .user(user)
                .build();
        subscriptionEventRepository.save(subscriptionEvent);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }
}
