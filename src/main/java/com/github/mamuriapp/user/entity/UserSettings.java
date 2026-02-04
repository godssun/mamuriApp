package com.github.mamuriapp.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 사용자 설정 엔티티.
 * AI 톤 선호도 등 개인화 설정을 저장한다.
 */
@Entity
@Table(name = "user_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** AI 응답 톤 (예: warm, calm, cheerful) */
    @Column(name = "ai_tone", nullable = false)
    private String aiTone = "warm";

    /** AI 코멘트 활성화 여부 */
    @Column(name = "ai_enabled", nullable = false)
    private boolean aiEnabled = true;

    @Builder
    public UserSettings(User user, String aiTone, boolean aiEnabled) {
        this.user = user;
        this.aiTone = aiTone;
        this.aiEnabled = aiEnabled;
    }

    /**
     * AI 톤 설정을 변경한다.
     *
     * @param aiTone 새로운 AI 톤
     */
    public void updateAiTone(String aiTone) {
        this.aiTone = aiTone;
    }

    /**
     * AI 코멘트 활성화 여부를 변경한다.
     *
     * @param aiEnabled 활성화 여부
     */
    public void updateAiEnabled(boolean aiEnabled) {
        this.aiEnabled = aiEnabled;
    }
}
