package com.github.mamuriapp.diary.entity;

import com.github.mamuriapp.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 일기 사진 엔티티.
 */
@Entity
@Table(name = "diary_photos", indexes = {
        @Index(name = "idx_diary_photos_diary", columnList = "diary_id, display_order")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DiaryPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diary_id", nullable = false)
    private Diary diary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "storage_key", nullable = false, length = 500)
    private String storageKey;

    @Column(name = "original_filename", length = 255)
    private String originalFilename;

    @Column(name = "content_type", length = 50)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private long fileSize;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "position_x")
    private Double positionX;

    @Column(name = "position_y")
    private Double positionY;

    @Column(name = "display_width")
    private Integer displayWidth;

    @Column(name = "display_height")
    private Integer displayHeight;

    @Column(name = "z_index")
    private Integer zIndex = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public DiaryPhoto(Diary diary, User user, String storageKey,
                      String originalFilename, String contentType,
                      long fileSize, int displayOrder) {
        this.diary = diary;
        this.user = user;
        this.storageKey = storageKey;
        this.originalFilename = originalFilename;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.displayOrder = displayOrder;
    }

    public void updatePosition(Double positionX, Double positionY,
                               Integer displayWidth, Integer displayHeight,
                               Integer zIndex) {
        this.positionX = positionX;
        this.positionY = positionY;
        this.displayWidth = displayWidth;
        this.displayHeight = displayHeight;
        this.zIndex = zIndex;
    }
}
