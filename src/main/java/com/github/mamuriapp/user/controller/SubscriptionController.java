package com.github.mamuriapp.user.controller;

import com.github.mamuriapp.global.dto.ApiResponse;
import com.github.mamuriapp.user.dto.CheckoutRequest;
import com.github.mamuriapp.user.dto.CheckoutResponse;
import com.github.mamuriapp.user.dto.SubscriptionStatusResponse;
import com.github.mamuriapp.user.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 구독 관리 컨트롤러.
 */
@RestController
@RequestMapping("/api/subscription")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    /**
     * Stripe Checkout Session을 생성한다.
     */
    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<CheckoutResponse>> createCheckout(
            Authentication authentication,
            @Valid @RequestBody CheckoutRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        String url = subscriptionService.createCheckoutSession(userId, request.getPriceId());
        return ResponseEntity.ok(ApiResponse.success(new CheckoutResponse(url)));
    }

    /**
     * 구독 상태를 조회한다.
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<SubscriptionStatusResponse>> getStatus(
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        SubscriptionStatusResponse response = subscriptionService.getSubscriptionStatus(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 구독을 취소한다.
     */
    @PostMapping("/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelSubscription(
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        subscriptionService.cancelSubscription(userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
