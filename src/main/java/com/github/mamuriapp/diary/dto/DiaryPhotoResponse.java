package com.github.mamuriapp.diary.dto;

import com.github.mamuriapp.diary.entity.DiaryPhoto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 일기 사진 응답 DTO.
 */
@Getter
@AllArgsConstructor
@Builder
public class DiaryPhotoResponse {

    private Long id;
    private String url;
    private String originalFilename;
    private long fileSize;
    private int displayOrder;
    private LocalDateTime createdAt;

    public static DiaryPhotoResponse from(DiaryPhoto photo, String publicUrl) {
        return DiaryPhotoResponse.builder()
                .id(photo.getId())
                .url(publicUrl)
                .originalFilename(photo.getOriginalFilename())
                .fileSize(photo.getFileSize())
                .displayOrder(photo.getDisplayOrder())
                .createdAt(photo.getCreatedAt())
                .build();
    }
}
