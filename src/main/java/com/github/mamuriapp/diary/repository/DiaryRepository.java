package com.github.mamuriapp.diary.repository;

import com.github.mamuriapp.diary.entity.Diary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 일기 리포지토리.
 */
public interface DiaryRepository extends JpaRepository<Diary, Long> {

    /**
     * 사용자의 일기 목록을 최신순으로 조회한다.
     *
     * @param userId 사용자 ID
     * @return 일기 목록
     */
    List<Diary> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * 사용자의 특정 일기를 조회한다.
     *
     * @param id     일기 ID
     * @param userId 사용자 ID
     * @return 일기 Optional
     */
    Optional<Diary> findByIdAndUserId(Long id, Long userId);
}
