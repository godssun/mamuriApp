package com.github.mamuriapp.diary.dto;

import com.github.mamuriapp.diary.entity.DiaryDecoration;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * 일기 꾸미기 배치 응답 DTO.
 */
@Getter
@AllArgsConstructor
@Builder
public class DiaryDecorationResponse {

    private Long id;
    private Long assetId;
    private String assetCode;
    private String imageUrl;
    private double positionX;
    private double positionY;
    private double scale;
    private double rotation;
    private int zIndex;

    public static DiaryDecorationResponse from(DiaryDecoration decoration) {
        return DiaryDecorationResponse.builder()
                .id(decoration.getId())
                .assetId(decoration.getAsset().getId())
                .assetCode(decoration.getAsset().getCode())
                .imageUrl(decoration.getAsset().getImageUrl())
                .positionX(decoration.getPositionX())
                .positionY(decoration.getPositionY())
                .scale(decoration.getScale())
                .rotation(decoration.getRotation())
                .zIndex(decoration.getZIndex())
                .build();
    }
}
