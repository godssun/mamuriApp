package com.github.mamuriapp.diary.repository;

import com.github.mamuriapp.diary.entity.CustomSticker;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 커스텀 스티커 리포지토리.
 */
public interface CustomStickerRepository extends JpaRepository<CustomSticker, Long> {

    List<CustomSticker> findByUserIdOrderByCreatedAtDesc(Long userId);

    int countByUserId(Long userId);

    Optional<CustomSticker> findByIdAndUserId(Long id, Long userId);
}
