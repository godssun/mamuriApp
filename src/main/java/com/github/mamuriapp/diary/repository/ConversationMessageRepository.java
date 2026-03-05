package com.github.mamuriapp.diary.repository;

import com.github.mamuriapp.diary.entity.ConversationMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 대화 메시지 리포지토리.
 */
public interface ConversationMessageRepository extends JpaRepository<ConversationMessage, Long> {

    /**
     * 일기의 대화 메시지를 순서대로 조회한다.
     *
     * @param diaryId 일기 ID
     * @return 대화 메시지 목록 (sequence_number 오름차순)
     */
    List<ConversationMessage> findByDiaryIdOrderBySequenceNumberAsc(Long diaryId);

    /**
     * 일기의 특정 역할 메시지 수를 조회한다.
     *
     * @param diaryId 일기 ID
     * @param role    역할 (USER 또는 AI)
     * @return 메시지 수
     */
    int countByDiaryIdAndRole(Long diaryId, String role);

    /**
     * 일기의 최근 대화 메시지를 조회한다 (프롬프트 컨텍스트용).
     *
     * @param diaryId  일기 ID
     * @param pageable 페이징 (최근 N개)
     * @return 대화 메시지 목록
     */
    @Query("SELECT cm FROM ConversationMessage cm WHERE cm.diary.id = :diaryId " +
           "ORDER BY cm.sequenceNumber DESC")
    List<ConversationMessage> findRecentByDiaryId(@Param("diaryId") Long diaryId, Pageable pageable);

    /**
     * 특정 사용자의 특정 시각 이후 역할별 메시지 수를 조회한다 (일별 제한 검사용).
     *
     * @param userId 사용자 ID
     * @param role   역할 (USER 또는 AI)
     * @param since  조회 시작 시각
     * @return 메시지 수
     */
    @Query("SELECT COUNT(cm) FROM ConversationMessage cm " +
           "WHERE cm.user.id = :userId AND cm.role = :role " +
           "AND cm.createdAt >= :since")
    int countByUserIdAndRoleAndCreatedAtAfter(
            @Param("userId") Long userId,
            @Param("role") String role,
            @Param("since") LocalDateTime since);

    // --- 모니터링 쿼리 ---

    /**
     * 대화가 활성화된 일기 수를 조회한다 (1개 이상 메시지 존재).
     *
     * @param since 조회 시작 시각
     * @return 활성 대화 수
     */
    @Query("SELECT COUNT(DISTINCT cm.diary.id) FROM ConversationMessage cm WHERE cm.createdAt >= :since")
    long countActiveConversationsSince(@Param("since") LocalDateTime since);

    /**
     * 특정 기간의 역할별 메시지 수를 조회한다.
     *
     * @param role  역할 (USER 또는 AI)
     * @param since 조회 시작 시각
     * @return 메시지 수
     */
    long countByRoleAndCreatedAtAfter(String role, LocalDateTime since);

    /**
     * 특정 기간의 일별 대화 메시지 수를 조회한다.
     *
     * @param since 조회 시작 시각
     * @return [날짜, USER 메시지수, AI 메시지수] 목록
     */
    @Query("SELECT CAST(cm.createdAt AS LocalDate), " +
           "SUM(CASE WHEN cm.role = 'USER' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN cm.role = 'AI' THEN 1 ELSE 0 END) " +
           "FROM ConversationMessage cm WHERE cm.createdAt >= :since " +
           "GROUP BY CAST(cm.createdAt AS LocalDate) " +
           "ORDER BY CAST(cm.createdAt AS LocalDate) DESC")
    List<Object[]> findDailyMessageStats(@Param("since") LocalDateTime since);

    /**
     * 대화당 평균 메시지 수를 조회한다.
     *
     * @param since 조회 시작 시각
     * @return 평균 메시지 수 (대화 없으면 null)
     */
    @Query("SELECT AVG(sub.msgCount) FROM " +
           "(SELECT cm.diary.id AS diaryId, COUNT(cm) AS msgCount " +
           "FROM ConversationMessage cm WHERE cm.createdAt >= :since " +
           "GROUP BY cm.diary.id) sub")
    Double findAverageMessagesPerConversation(@Param("since") LocalDateTime since);
}

