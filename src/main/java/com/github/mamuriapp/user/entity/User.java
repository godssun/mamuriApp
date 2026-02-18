package com.github.mamuriapp.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 사용자 엔티티.
 */
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String nickname;

    @Column(name = "ai_name")
    private String aiName = "마음이";

    @Column(name = "max_level", nullable = false)
    private int maxLevel = 1;

    @Column(name = "diary_count", nullable = false)
    private long diaryCount = 0;

    @Column(name = "refresh_token")
    private String refreshToken;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public User(String email, String password, String nickname, String aiName) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.aiName = (aiName != null && !aiName.isBlank()) ? aiName : "마음이";
    }

    /**
     * 리프레시 토큰을 갱신한다.
     *
     * @param refreshToken 새로운 리프레시 토큰
     */
    public void updateRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public void updateAiName(String aiName) {
        this.aiName = aiName;
    }

    public void updateMaxLevel(int level) {
        if (level > this.maxLevel) {
            this.maxLevel = level;
        }
    }

    public void incrementDiaryCount() {
        this.diaryCount++;
    }

    public void decrementDiaryCount() {
        if (this.diaryCount > 0) {
            this.diaryCount--;
        }
    }
}
