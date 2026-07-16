package com.github.mamuriapp.diary.dto;

import com.github.mamuriapp.diary.entity.CustomSticker;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 커스텀 스티커 응답 DTO.
 */
@Getter
@AllArgsConstructor
@Builder
public class CustomStickerResponse {

    private Long id;
    private String url;
    private String cdnUrl;
    private long fileSize;
    private Integer width;
    private Integer height;
    private String borderStyle;
    private LocalDateTime createdAt;

    public static CustomStickerResponse from(CustomSticker sticker, String publicUrl) {
        return CustomStickerResponse.builder()
                .id(sticker.getId())
                .url(publicUrl)
                .cdnUrl(publicUrl)
                .fileSize(sticker.getFileSize())
                .width(sticker.getWidth())
                .height(sticker.getHeight())
                .borderStyle(sticker.getBorderStyle())
                .createdAt(sticker.getCreatedAt())
                .build();
    }
}
