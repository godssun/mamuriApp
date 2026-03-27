package com.github.mamuriapp.diary.repository;

import com.github.mamuriapp.diary.entity.DiaryPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * 일기 사진 리포지토리.
 */
public interface DiaryPhotoRepository extends JpaRepository<DiaryPhoto, Long> {

    List<DiaryPhoto> findByDiaryIdOrderByDisplayOrderAsc(Long diaryId);

    int countByDiaryId(Long diaryId);

    @Query("SELECT COALESCE(SUM(p.fileSize), 0) FROM DiaryPhoto p WHERE p.user.id = :userId")
    long sumFileSizeByUserId(@Param("userId") Long userId);

    void deleteByDiaryId(Long diaryId);
}
