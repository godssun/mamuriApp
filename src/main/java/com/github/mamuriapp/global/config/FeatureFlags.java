package com.github.mamuriapp.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Feature Flag 설정.
 * 프리미엄/쿼터 기능의 점진적 롤아웃을 제어한다.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "feature")
public class FeatureFlags {

    /** 프리미엄 구독 기능 활성화 여부 (기본: false) */
    private boolean premiumEnabled = false;

    /** 쿼터 제한 적용 여부 (기본: false) */
    private boolean quotaEnforcementEnabled = false;

    /** 대화 기능 활성화 여부 (기본: false) */
    private boolean conversationEnabled = false;
}
