package com.github.mamuriapp.diary.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.util.List;

/**
 * 꾸미기 배치 요청 DTO.
 */
@Getter
public class DecorationPlacementRequest {

    @Valid
    @NotNull
    private List<DecorationItem> decorations;

    @Getter
    public static class DecorationItem {
        private Long assetId;
        private String assetType;
        private double positionX;
        private double positionY;
        private double scale = 1.0;
        private double rotation;
        private int zIndex;
    }
}
