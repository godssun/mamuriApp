package com.github.mamuriapp.diary.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 일기별 꾸미기 배치 엔티티.
 */
@Entity
@Table(name = "diary_decorations", indexes = {
        @Index(name = "idx_diary_decorations_diary", columnList = "diary_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DiaryDecoration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diary_id", nullable = false)
    private Diary diary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    private DecorationAsset asset;

    @Column(name = "position_x", nullable = false)
    private double positionX;

    @Column(name = "position_y", nullable = false)
    private double positionY;

    @Column(nullable = false)
    private double scale = 1.0;

    @Column(nullable = false)
    private double rotation;

    @Column(name = "z_index", nullable = false)
    private int zIndex;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public DiaryDecoration(Diary diary, DecorationAsset asset,
                           double positionX, double positionY,
                           double scale, double rotation, int zIndex) {
        this.diary = diary;
        this.asset = asset;
        this.positionX = positionX;
        this.positionY = positionY;
        this.scale = scale;
        this.rotation = rotation;
        this.zIndex = zIndex;
    }
}
