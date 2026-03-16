package com.github.mamuriapp.user.service;

import com.github.mamuriapp.global.config.FeatureFlags;
import com.github.mamuriapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 쿼터 리셋 스케줄러.
 * 매월 1일 0시에 전체 사용자의 AI 쿼터를 초기화한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class QuotaResetScheduler {

    private final UserRepository userRepository;
    private final FeatureFlags featureFlags;

    /**
     * 매월 1일 0시에 실행.
     */
    @Scheduled(cron = "0 0 0 1 * *")
    @Transactional
    public void resetMonthlyQuotas() {
        if (!featureFlags.isQuotaEnforcementEnabled()) {
            log.info("[Quota] 쿼터 기능 비활성화 — 리셋 건너뜀");
            return;
        }

        int count = userRepository.bulkResetQuota();
        log.info("[Quota] 월간 쿼터 리셋 완료: {}명", count);
    }
}
