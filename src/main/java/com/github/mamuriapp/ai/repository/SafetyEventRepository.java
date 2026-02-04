package com.github.mamuriapp.ai.repository;

import com.github.mamuriapp.ai.entity.SafetyEvent;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
