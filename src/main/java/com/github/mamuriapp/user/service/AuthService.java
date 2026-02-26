package com.github.mamuriapp.user.service;

import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.global.security.JwtTokenProvider;
import com.github.mamuriapp.user.dto.*;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.entity.UserSettings;
import com.github.mamuriapp.user.repository.UserRepository;
import com.github.mamuriapp.user.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 인증 서비스.
 * 회원가입, 로그인, 토큰 갱신을 처리한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 새로운 사용자를 등록한다.
     *
     * @param request 회원가입 요청 DTO
     * @return 발급된 토큰 응답
     */
    @Transactional
    public TokenResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException(ErrorCode.DUPLICATE_EMAIL);
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .aiName(request.getAiName())
                .build();
        userRepository.save(user);

        UserSettings settings = UserSettings.builder()
                .user(user)
                .aiTone("warm")
                .aiEnabled(true)
                .build();
        userSettingsRepository.save(settings);

        return issueTokens(user);
    }

    /**
     * 이메일과 비밀번호로 로그인한다.
     *
     * @param request 로그인 요청 DTO
     * @return 발급된 토큰 응답
     */
    @Transactional
    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.INVALID_CREDENTIALS);
        }

        return issueTokens(user);
    }

    /**
     * 리프레시 토큰으로 새로운 토큰 쌍을 발급한다.
     * 토큰 회전(rotation)을 적용하여, 이전 토큰 재사용 시 모든 토큰을 무효화한다.
     *
     * @param request 토큰 갱신 요청 DTO
     * @return 새로 발급된 토큰 응답
     */
    @Transactional
    public TokenResponse refresh(TokenRefreshRequest request) {
        String oldRefreshToken = request.getRefreshToken();

        if (!jwtTokenProvider.validateToken(oldRefreshToken)) {
            throw new CustomException(ErrorCode.TOKEN_INVALID);
        }

        Long userId = jwtTokenProvider.getUserId(oldRefreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (!oldRefreshToken.equals(user.getRefreshToken())) {
            log.warn("Refresh token 재사용 감지 (userId={}). 모든 토큰 무효화.", userId);
            user.updateRefreshToken(null);
            throw new CustomException(ErrorCode.TOKEN_REUSE_DETECTED);
        }

        return issueTokens(user);
    }

    /**
     * 로그아웃을 처리한다.
     * 저장된 리프레시 토큰을 무효화한다.
     *
     * @param userId 로그아웃할 사용자 ID
     */
    @Transactional
    public void logout(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        user.updateRefreshToken(null);
    }

    private TokenResponse issueTokens(User user) {
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId(), user.getEmail());
        user.updateRefreshToken(refreshToken);
        return new TokenResponse(accessToken, refreshToken);
    }
}
