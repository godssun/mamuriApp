package com.github.mamuriapp.ai.repository;

import com.github.mamuriapp.ai.entity.SafetyEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 안전 이벤트 리포지토리.
 */
public interface SafetyEventRepository extends JpaRepository<SafetyEvent, Long> {

    /**
     * 일기 ID로 안전 이벤트 목록을 조회한다.
     *
     * @param diaryId 일기 ID
     * @return 안전 이벤트 목록
     */
    List<SafetyEvent> findByDiaryId(Long diaryId);

    // --- Admin 쿼리 ---

    long countByCreatedAtAfter(LocalDateTime since);

    @Query("SELECT s.eventType, COUNT(s) FROM SafetyEvent s " +
           "WHERE s.createdAt >= :since GROUP BY s.eventType")
    List<Object[]> countByEventTypeSince(@Param("since") LocalDateTime since);

    Page<SafetyEvent> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime since, Pageable pageable);
}
