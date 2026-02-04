package com.github.mamuriapp.user.repository;

import com.github.mamuriapp.user.entity.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 사용자 설정 리포지토리.
 */
public interface UserSettingsRepository extends JpaRepository<UserSettings, Long> {

    /**
     * 사용자 ID로 설정을 조회한다.
     *
     * @param userId 사용자 ID
     * @return 사용자 설정 Optional
     */
    Optional<UserSettings> findByUserId(Long userId);
}
