package com.github.mamuriapp.ai.repository;

import com.github.mamuriapp.ai.entity.UserMemory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * AI 기억 리포지토리.
 */
public interface UserMemoryRepository extends JpaRepository<UserMemory, Long> {

    /**
     * 사용자의 활성 기억을 중요도순으로 조회한다.
     */
    @Query("SELECT m FROM UserMemory m WHERE m.user.id = :userId AND m.status = 'ACTIVE' " +
           "ORDER BY m.importance DESC, m.mentionCount DESC")
    List<UserMemory> findActiveByUserId(@Param("userId") Long userId);

    /**
     * 사용자의 상위 N개 기억을 조회한다 (AI 프롬프트용).
     */
    @Query("SELECT m FROM UserMemory m WHERE m.user.id = :userId AND m.status = 'ACTIVE' " +
           "ORDER BY m.importance DESC, m.mentionCount DESC")
    List<UserMemory> findTopMemories(@Param("userId") Long userId, Pageable pageable);

    /**
     * 유사한 기억이 이미 존재하는지 확인한다.
     */
    @Query("SELECT m FROM UserMemory m WHERE m.user.id = :userId " +
           "AND m.memoryType = :type AND m.status = 'ACTIVE' " +
           "AND LOWER(m.content) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<UserMemory> findSimilar(@Param("userId") Long userId,
                                  @Param("type") String type,
                                  @Param("keyword") String keyword);

    /**
     * 사용자의 기억 수를 조회한다.
     */
    long countByUserIdAndStatus(Long userId, String status);

    Optional<UserMemory> findByIdAndUserId(Long id, Long userId);

    List<UserMemory> findByStatus(String status);

    /**
     * 사용자의 기억을 계층별로 조회한다.
     */
    @Query("SELECT m FROM UserMemory m WHERE m.user.id = :userId AND m.status = 'ACTIVE' " +
           "AND m.memoryTier = :tier ORDER BY m.importance DESC, m.mentionCount DESC")
    List<UserMemory> findByUserIdAndTier(@Param("userId") Long userId,
                                          @Param("tier") String tier, Pageable pageable);
}
