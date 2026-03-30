package com.github.mamuriapp.diary.dto;

import com.github.mamuriapp.diary.entity.EmotionCategory;
import com.github.mamuriapp.diary.entity.EmotionSticker;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 스티커 카테고리 응답 DTO.
 */
@Getter
@AllArgsConstructor
@Builder
public class StickerCategoryResponse {

    private Long id;
    private String code;
    private String nameKo;
    private String colorHex;
    private List<StickerResponse> stickers;

    public static StickerCategoryResponse of(EmotionCategory category, List<EmotionSticker> stickers) {
        List<StickerResponse> stickerResponses = stickers.stream()
                .map(StickerResponse::from)
                .toList();
        return StickerCategoryResponse.builder()
                .id(category.getId())
                .code(category.getCode())
                .nameKo(category.getNameKo())
                .colorHex(category.getColorHex())
                .stickers(stickerResponses)
                .build();
    }

    @Getter
    @AllArgsConstructor
    @Builder
    public static class StickerResponse {
        private Long id;
        private String code;
        private String nameKo;
        private String imageUrl;
        private boolean isDefault;
        private boolean isPremium;

        public static StickerResponse from(EmotionSticker sticker) {
            return StickerResponse.builder()
                    .id(sticker.getId())
                    .code(sticker.getCode())
                    .nameKo(sticker.getNameKo())
                    .imageUrl(sticker.getImageUrl())
                    .isDefault(sticker.isDefault())
                    .isPremium(sticker.isPremium())
                    .build();
        }
    }
}
