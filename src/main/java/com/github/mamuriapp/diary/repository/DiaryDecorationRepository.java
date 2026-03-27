package com.github.mamuriapp.diary.repository;

import com.github.mamuriapp.diary.entity.DiaryDecoration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 일기 꾸미기 리포지토리.
 */
public interface DiaryDecorationRepository extends JpaRepository<DiaryDecoration, Long> {

    List<DiaryDecoration> findByDiaryIdOrderByZIndexAsc(Long diaryId);

    void deleteByDiaryId(Long diaryId);
}
