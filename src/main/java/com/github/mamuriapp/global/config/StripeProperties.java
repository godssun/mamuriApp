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
 */
@Slf4j
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "stripe")
public class StripeProperties {

    private String apiKey = "";
    private String webhookSecret = "";
    private String priceMonthly = "";
    private String priceYearly = "";

    @PostConstruct
    void init() {
        if (apiKey != null && !apiKey.isBlank()) {
            Stripe.apiKey = apiKey;
            log.info("[Stripe] API 키 설정 완료");
        } else {
            log.warn("[Stripe] API 키가 설정되지 않았습니다");
        }
    }
}
