package com.github.mamuriapp.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 계정 삭제 로그.
 * 유저 삭제 후에도 분석을 위해 보존된다.
 */
@Entity
@Table(name = "account_deletion_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AccountDeletionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(nullable = false, length = 100)
    private String reason;

    @Column(name = "reason_detail", columnDefinition = "TEXT")
    private String reasonDetail;

    @CreationTimestamp
    @Column(name = "deleted_at", nullable = false, updatable = false)
    private LocalDateTime deletedAt;

    @Builder
    public AccountDeletionLog(String userEmail, String reason, String reasonDetail) {
        this.userEmail = userEmail;
        this.reason = reason;
        this.reasonDetail = reasonDetail;
    }
}
