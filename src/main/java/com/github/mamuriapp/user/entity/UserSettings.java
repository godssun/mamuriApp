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

    /** AI 응답 톤 (예: warm, calm, cheerful, realistic) */
    @Column(name = "ai_tone", nullable = false)
    private String aiTone = "warm";

    /** AI 코멘트 활성화 여부 */
    @Column(name = "ai_enabled", nullable = false)
    private boolean aiEnabled = true;

    /** AI 친구 프로필 사진 URL (null이면 레벨 기반 기본 이모지) */
    @Column(name = "ai_avatar", length = 500)
    private String aiAvatar;

    /** AI 말투 스타일 (formal: 존댓말, casual: 반말) */
    @Column(name = "ai_speech_style", nullable = false)
    private String aiSpeechStyle = "formal";

    @Builder
    public UserSettings(User user, String aiTone, boolean aiEnabled,
                        String aiAvatar, String aiSpeechStyle) {
        this.user = user;
        this.aiTone = aiTone;
        this.aiEnabled = aiEnabled;
        this.aiAvatar = aiAvatar;
        this.aiSpeechStyle = aiSpeechStyle != null ? aiSpeechStyle : "formal";
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

    /**
     * 프로필 사진 URL을 변경한다.
     *
     * @param aiAvatar 새로운 프로필 사진 URL (null이면 기본 아바타로 리셋)
     */
    public void updateAiAvatar(String aiAvatar) {
        this.aiAvatar = aiAvatar;
    }

    /**
     * AI 말투 스타일을 변경한다.
     *
     * @param aiSpeechStyle 새로운 말투 스타일
     */
    public void updateAiSpeechStyle(String aiSpeechStyle) {
        this.aiSpeechStyle = aiSpeechStyle;
    }
}
