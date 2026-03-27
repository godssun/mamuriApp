package com.github.mamuriapp.diary.repository;

import com.github.mamuriapp.diary.entity.DiaryDecoration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * 일기 꾸미기 리포지토리.
 */
public interface DiaryDecorationRepository extends JpaRepository<DiaryDecoration, Long> {

    @Query("SELECT d FROM DiaryDecoration d WHERE d.diary.id = :diaryId ORDER BY d.zIndex ASC")
    List<DiaryDecoration> findByDiaryIdOrderByZIndexAsc(@Param("diaryId") Long diaryId);

    void deleteByDiaryId(Long diaryId);
}
