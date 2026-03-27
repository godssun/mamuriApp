package com.github.mamuriapp.diary.service;

import com.github.mamuriapp.diary.dto.DecorationAssetResponse;
import com.github.mamuriapp.diary.dto.DecorationPlacementRequest;
import com.github.mamuriapp.diary.dto.DiaryDecorationResponse;
import com.github.mamuriapp.diary.entity.DecorationAsset;
import com.github.mamuriapp.diary.entity.Diary;
import com.github.mamuriapp.diary.entity.DiaryDecoration;
import com.github.mamuriapp.diary.repository.DecorationAssetRepository;
import com.github.mamuriapp.diary.repository.DiaryDecorationRepository;
import com.github.mamuriapp.diary.repository.DiaryRepository;
import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 꾸미기 서비스.
 */
@Service
@RequiredArgsConstructor
public class DecorationService {

    private final DecorationAssetRepository assetRepository;
    private final DiaryDecorationRepository decorationRepository;
    private final DiaryRepository diaryRepository;

    /**
     * 전체 꾸미기 에셋을 조회한다.
     */
    @Transactional(readOnly = true)
    public List<DecorationAssetResponse> getAssets() {
        return assetRepository.findByActiveTrueOrderByCategoryAscDisplayOrderAsc().stream()
                .map(DecorationAssetResponse::from)
                .toList();
    }

    /**
     * 카테고리별 꾸미기 에셋을 조회한다.
     */
    @Transactional(readOnly = true)
    public List<DecorationAssetResponse> getAssetsByCategory(String category) {
        return assetRepository.findByCategoryAndActiveTrueOrderByDisplayOrderAsc(category).stream()
                .map(DecorationAssetResponse::from)
                .toList();
    }

    /**
     * 일기의 꾸미기 배치를 조회한다.
     */
    @Transactional(readOnly = true)
    public List<DiaryDecorationResponse> getDecorations(Long diaryId) {
        return decorationRepository.findByDiaryIdOrderByZIndexAsc(diaryId).stream()
                .map(DiaryDecorationResponse::from)
                .toList();
    }

    /**
     * 일기의 꾸미기를 저장한다 (전체 교체).
     */
    @Transactional
    public List<DiaryDecorationResponse> saveDecorations(Long diaryId, Long userId,
                                                          DecorationPlacementRequest request) {
        Diary diary = diaryRepository.findByIdAndUserId(diaryId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.DIARY_NOT_FOUND));

        // 기존 꾸미기 삭제
        decorationRepository.deleteByDiaryId(diaryId);

        // 새 꾸미기 저장
        List<DiaryDecoration> decorations = request.getDecorations().stream()
                .map(item -> {
                    DecorationAsset asset = assetRepository.findById(item.getAssetId())
                            .orElseThrow(() -> new CustomException(ErrorCode.INVALID_INPUT));
                    return DiaryDecoration.builder()
                            .diary(diary)
                            .asset(asset)
                            .positionX(item.getPositionX())
                            .positionY(item.getPositionY())
                            .scale(item.getScale())
                            .rotation(item.getRotation())
                            .zIndex(item.getZIndex())
                            .build();
                })
                .toList();

        decorationRepository.saveAll(decorations);

        return decorations.stream()
                .map(DiaryDecorationResponse::from)
                .toList();
    }
}
