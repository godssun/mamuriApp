package com.github.mamuriapp.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Stripe Checkout 요청 DTO.
 */
@Getter
@NoArgsConstructor
public class CheckoutRequest {

    @NotBlank(message = "가격 ID는 필수입니다.")
    private String priceId;
}
