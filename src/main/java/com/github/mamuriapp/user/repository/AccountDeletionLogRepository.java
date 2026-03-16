package com.github.mamuriapp.user.repository;

import com.github.mamuriapp.user.entity.AccountDeletionLog;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 계정 삭제 로그 리포지토리.
 */
public interface AccountDeletionLogRepository extends JpaRepository<AccountDeletionLog, Long> {
}
