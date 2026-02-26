package com.github.mamuriapp.ai.repository;

import com.github.mamuriapp.ai.entity.AiUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * AI 사용량 로그 리포지토리.
 */
public interface AiUsageLogRepository extends JpaRepository<AiUsageLog, Long> {
}
