package com.github.mamuriapp.diary.repository;

import com.github.mamuriapp.diary.entity.EmotionCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 감정 카테고리 리포지토리.
 */
public interface EmotionCategoryRepository extends JpaRepository<EmotionCategory, Long> {

    List<EmotionCategory> findByActiveTrueOrderByDisplayOrderAsc();

    Optional<EmotionCategory> findByCode(String code);
}
