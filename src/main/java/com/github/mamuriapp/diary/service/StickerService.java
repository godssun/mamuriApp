package com.github.mamuriapp.diary.service;

import com.github.mamuriapp.diary.dto.StickerCategoryResponse;
import com.github.mamuriapp.diary.entity.EmotionCategory;
import com.github.mamuriapp.diary.entity.EmotionSticker;
import com.github.mamuriapp.diary.repository.EmotionCategoryRepository;
import com.github.mamuriapp.diary.repository.EmotionStickerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 스티커 카탈로그 서비스.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StickerService {

    private final EmotionCategoryRepository categoryRepository;
    private final EmotionStickerRepository stickerRepository;

    /**
     * 전체 스티커 카탈로그를 카테고리별로 조회한다.
     */
    public List<StickerCategoryResponse> getCatalog() {
        List<EmotionCategory> categories = categoryRepository.findByActiveTrueOrderByDisplayOrderAsc();
        return categories.stream()
                .map(cat -> {
                    List<EmotionSticker> stickers =
                            stickerRepository.findByCategoryIdAndActiveTrueOrderByDisplayOrderAsc(cat.getId());
                    return StickerCategoryResponse.of(cat, stickers);
                })
                .toList();
    }

    /**
     * 무료 스티커만 조회한다.
     */
    public List<StickerCategoryResponse.StickerResponse> getFreeStickers() {
        return stickerRepository.findFreeStickers().stream()
                .map(StickerCategoryResponse.StickerResponse::from)
                .toList();
    }
}
