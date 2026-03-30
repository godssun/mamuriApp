package com.github.mamuriapp.diary.repository;

import com.github.mamuriapp.diary.entity.EmotionSticker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * 감정 스티커 리포지토리.
 */
public interface EmotionStickerRepository extends JpaRepository<EmotionSticker, Long> {

    List<EmotionSticker> findByActiveTrueOrderByCategoryDisplayOrderAscDisplayOrderAsc();

    List<EmotionSticker> findByCategoryIdAndActiveTrueOrderByDisplayOrderAsc(Long categoryId);

    @Query("SELECT s FROM EmotionSticker s WHERE s.active = true AND s.premium = false " +
           "ORDER BY s.category.displayOrder, s.displayOrder")
    List<EmotionSticker> findFreeStickers();

    Optional<EmotionSticker> findByCode(String code);
}
