package com.github.mamuriapp.user.controller;

import com.github.mamuriapp.global.config.StripeProperties;
import com.github.mamuriapp.user.service.SubscriptionService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Stripe Webhook 컨트롤러.
 * 인증 불필요 — SecurityConfig에서 permitAll로 설정.
 */
@Slf4j
@RestController
@RequestMapping("/api/stripe")
@RequiredArgsConstructor
public class StripeWebhookController {

    private final SubscriptionService subscriptionService;
    private final StripeProperties stripeProperties;

    /**
     * Stripe 웹훅 이벤트를 수신한다.
     * 서명 검증 후 이벤트를 처리한다.
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        Event event;
        try {
            event = Webhook.constructEvent(
                    payload, sigHeader, stripeProperties.getWebhookSecret());
        } catch (SignatureVerificationException e) {
            log.warn("[Stripe] 웹훅 서명 검증 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Invalid signature");
        }

        try {
            subscriptionService.handleWebhookEvent(event);
        } catch (Exception e) {
            log.error("[Stripe] 웹훅 이벤트 처리 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Processing failed");
        }

        return ResponseEntity.ok("OK");
    }
}
