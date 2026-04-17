package com.github.mamuriapp.schedule.repository;

import com.github.mamuriapp.schedule.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    Optional<Schedule> findByIdAndUserId(Long id, Long userId);

    /**
     * 특정 사용자·기간의 일정을 시작 시각 오름차순으로 조회.
     * endAt이 null이어도 startAt 기준으로 포함한다.
     */
    @Query("SELECT s FROM Schedule s WHERE s.user.id = :userId " +
           "AND s.startAt >= :from AND s.startAt < :to " +
           "ORDER BY s.startAt ASC, s.id ASC")
    List<Schedule> findInRange(@Param("userId") Long userId,
                               @Param("from") LocalDateTime from,
                               @Param("to") LocalDateTime to);

    List<Schedule> findByUserIdAndLinkedDiaryId(Long userId, Long linkedDiaryId);
}
