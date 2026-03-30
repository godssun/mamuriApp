package com.github.mamuriapp.diary.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 감정 스티커 엔티티.
 */
@Entity
@Table(name = "emotion_stickers", indexes = {
        @Index(name = "idx_emotion_stickers_category", columnList = "category_id, display_order")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmotionSticker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private EmotionCategory category;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name_ko", nullable = false, length = 30)
    private String nameKo;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    @Column(name = "is_premium", nullable = false)
    private boolean premium;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
