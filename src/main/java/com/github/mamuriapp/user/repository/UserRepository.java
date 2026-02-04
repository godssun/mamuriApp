package com.github.mamuriapp.user.repository;

import com.github.mamuriapp.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 사용자 리포지토리.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * 이메일로 사용자를 조회한다.
     *
     * @param email 사용자 이메일
     * @return 사용자 Optional
     */
    Optional<User> findByEmail(String email);

    /**
     * 이메일 존재 여부를 확인한다.
     *
     * @param email 확인할 이메일
     * @return 존재하면 true
     */
    boolean existsByEmail(String email);
}
