package com.github.mamuriapp.ai.repository;

import com.github.mamuriapp.ai.entity.AiComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * AI 코멘트 리포지토리.
 */
public interface AiCommentRepository extends JpaRepository<AiComment, Long> {

    /**
     * 일기 ID로 AI 코멘트를 조회한다.
     *
     * @param diaryId 일기 ID
     * @return AI 코멘트 Optional
     */
    Optional<AiComment> findByDiaryId(Long diaryId);
}
