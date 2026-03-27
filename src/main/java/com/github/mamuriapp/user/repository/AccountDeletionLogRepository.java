package com.github.mamuriapp.user.repository;

import com.github.mamuriapp.user.entity.AccountDeletionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 계정 삭제 로그 리포지토리.
 */
public interface AccountDeletionLogRepository extends JpaRepository<AccountDeletionLog, Long> {

    long countByDeletedAtAfter(LocalDateTime since);

    @Query("SELECT a.reason, COUNT(a) FROM AccountDeletionLog a " +
           "WHERE a.deletedAt >= :since GROUP BY a.reason ORDER BY COUNT(a) DESC")
    List<Object[]> countByReasonSince(@Param("since") LocalDateTime since);
}
