package com.github.mamuriapp.diary.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 감정 카테고리 엔티티.
 */
@Entity
@Table(name = "emotion_categories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmotionCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(name = "name_ko", nullable = false, length = 20)
    private String nameKo;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "color_hex", length = 7)
    private String colorHex;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
