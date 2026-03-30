package com.github.mamuriapp.diary.repository;

import com.github.mamuriapp.diary.entity.DecorationAsset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 꾸미기 에셋 리포지토리.
 */
public interface DecorationAssetRepository extends JpaRepository<DecorationAsset, Long> {

    List<DecorationAsset> findByActiveTrueOrderByCategoryAscDisplayOrderAsc();

    List<DecorationAsset> findByCategoryAndActiveTrueOrderByDisplayOrderAsc(String category);

    Optional<DecorationAsset> findByCode(String code);
}
