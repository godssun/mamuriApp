package com.github.mamuriapp.user.service;

import com.github.mamuriapp.global.config.StripeProperties;
import com.github.mamuriapp.user.repository.SubscriptionEventRepository;
import com.github.mamuriapp.user.repository.UserRepository;
import com.stripe.model.Event;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.ArgumentMatchers.any;

/**
 * SubscriptionService 웹훅 처리 단위 테스트.
 */
@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @InjectMocks
    private SubscriptionService subscriptionService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SubscriptionEventRepository subscriptionEventRepository;

    @Mock
    private StripeProperties stripeProperties;

    // --- Webhook 멱등성 ---

    @Nested
    @DisplayName("handleWebhookEvent 멱등성")
    class WebhookIdempotency {

        @Test
        @DisplayName("SS-01: 중복 이벤트는 무시된다")
        void handleWebhookEvent_duplicateEvent_skipped() {
            // given
            Event event = mock(Event.class);
            given(event.getId()).willReturn("evt_test_duplicate_123");
            given(event.getType()).willReturn("customer.subscription.created");

            given(subscriptionEventRepository.existsByStripeEventId("evt_test_duplicate_123"))
                    .willReturn(true);

            // when
            subscriptionService.handleWebhookEvent(event);

            // then - 사용자 조회나 이벤트 저장이 발생하지 않아야 한다
            verify(userRepository, never()).findByStripeCustomerId(any());
            verify(subscriptionEventRepository, never()).save(any());
        }
    }
}
