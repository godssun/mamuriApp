package com.github.mamuriapp.global.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Stripe 결제 관련 설정.
 * Deluxe / Premium 멀티 플랜 가격 ID를 관리한다.
 */
@Slf4j
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "stripe")
public class StripeProperties {

    private String apiKey = "";
    private String webhookSecret = "";

    // Deluxe 플랜 가격 ID
    private String priceDeluxeMonthly = "";
    private String priceDeluxeYearly = "";

    // Premium 플랜 가격 ID
    private String pricePremiumMonthly = "";
    private String pricePremiumYearly = "";

    @PostConstruct
    void init() {
        if (apiKey != null && !apiKey.isBlank()) {
            Stripe.apiKey = apiKey;
            log.info("[Stripe] API 키 설정 완료");
        } else {
            log.warn("[Stripe] API 키가 설정되지 않았습니다");
        }
    }

    /**
     * 주어진 Price ID가 Premium 플랜인지 확인한다.
     *
     * @param priceId Stripe Price ID
     * @return Premium이면 true
     */
    public boolean isPremiumPrice(String priceId) {
        return priceId.equals(pricePremiumMonthly) || priceId.equals(pricePremiumYearly);
    }

    /**
     * 주어진 Price ID가 Deluxe 플랜인지 확인한다.
     *
     * @param priceId Stripe Price ID
     * @return Deluxe이면 true
     */
    public boolean isDeluxePrice(String priceId) {
        return priceId.equals(priceDeluxeMonthly) || priceId.equals(priceDeluxeYearly);
    }
}
