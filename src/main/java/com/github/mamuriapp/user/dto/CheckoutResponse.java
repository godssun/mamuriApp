package com.github.mamuriapp.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Stripe Checkout 응답 DTO.
 */
@Getter
@AllArgsConstructor
public class CheckoutResponse {

    private String checkoutUrl;
}
