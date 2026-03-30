package com.github.mamuriapp.diary.dto;

import com.github.mamuriapp.diary.entity.DecorationAsset;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * 꾸미기 에셋 응답 DTO.
 */
@Getter
@AllArgsConstructor
@Builder
public class DecorationAssetResponse {

    private Long id;
    private String category;
    private String code;
    private String nameKo;
    private String imageUrl;
    private boolean isPremium;

    public static DecorationAssetResponse from(DecorationAsset asset) {
        return DecorationAssetResponse.builder()
                .id(asset.getId())
                .category(asset.getCategory())
                .code(asset.getCode())
                .nameKo(asset.getNameKo())
                .imageUrl(asset.getImageUrl())
                .isPremium(asset.isPremium())
                .build();
    }
}
