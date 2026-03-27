package com.github.mamuriapp.ai.repository;

import com.github.mamuriapp.ai.entity.ReflectionReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 리플렉션 리포트 리포지토리.
 */
public interface ReflectionReportRepository extends JpaRepository<ReflectionReport, Long> {

    List<ReflectionReport> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<ReflectionReport> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndReportTypeAndPeriodStart(Long userId, String reportType, LocalDate periodStart);

    List<ReflectionReport> findByUserIdAndReportTypeOrderByPeriodStartDesc(Long userId, String reportType);
}
