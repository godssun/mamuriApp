package com.github.mamuriapp.user.service;

import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.global.security.JwtTokenProvider;
import com.github.mamuriapp.user.dto.SocialLoginRequest;
import com.github.mamuriapp.user.dto.SocialLoginResponse;
import com.github.mamuriapp.user.dto.TokenResponse;
import com.github.mamuriapp.user.entity.AuthProvider;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.entity.UserSettings;
import com.github.mamuriapp.user.repository.UserRepository;
import com.github.mamuriapp.user.repository.UserSettingsRepository;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * 소셜 로그인 비즈니스 로직.
 * Google/Apple은 Firebase ID Token으로, Kakao는 Kakao Access Token으로 검증한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SocialAuthService {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final KakaoTokenVerifier kakaoTokenVerifier;

    /**
     * 소셜 로그인을 처리한다.
     * 1. provider별 토큰 검증
     * 2. email로 기존 사용자 조회
     * 3. 기존 사용자 → 프로바이더 매칭 확인 → 토큰 발급
     * 4. 신규 사용자 → nickname 필수 확인 → User 생성 + UserSettings 생성 → 토큰 발급
     */
    @Transactional
    public SocialLoginResponse socialLogin(SocialLoginRequest request) {
        SocialUserInfo userInfo = verifyToken(request.getProvider(), request.getToken());

        if (userInfo.email() == null || userInfo.email().isBlank()) {
            throw new CustomException(ErrorCode.SOCIAL_AUTH_FAILED);
        }

        Optional<User> existingUser = userRepository.findByEmail(userInfo.email());

        if (existingUser.isPresent()) {
            return handleExistingUser(existingUser.get(), request.getProvider(), userInfo);
        } else {
            return handleNewUser(request, userInfo);
        }
    }

    private SocialLoginResponse handleExistingUser(User user, AuthProvider provider, SocialUserInfo userInfo) {
        // 이메일 사용자가 소셜로 연결 시도 → account linking
        if (user.getAuthProvider() == AuthProvider.EMAIL) {
            // 기존 이메일 계정에 소셜 프로바이더 연결은 허용하지 않음 (보안상)
            throw new CustomException(ErrorCode.SOCIAL_PROVIDER_MISMATCH);
        }

        // 다른 소셜 프로바이더로 이미 가입됨
        if (user.getAuthProvider() != provider) {
            throw new CustomException(ErrorCode.SOCIAL_PROVIDER_MISMATCH);
        }

        TokenResponse tokens = issueTokens(user);
        return new SocialLoginResponse(
                tokens.getAccessToken(),
                tokens.getRefreshToken(),
                false,
                user.getNickname()
        );
    }

    private SocialLoginResponse handleNewUser(SocialLoginRequest request, SocialUserInfo userInfo) {
        String nickname = request.getNickname();
        if (nickname == null || nickname.isBlank()) {
            // 닉네임이 없으면 isNewUser=true로 반환하여 프론트에서 닉네임 입력 유도
            return new SocialLoginResponse(null, null, true, null);
        }

        User user = User.builder()
                .email(userInfo.email())
                .password(null)
                .nickname(nickname.trim())
                .authProvider(request.getProvider())
                .providerUid(userInfo.uid())
                .profileImageUrl(userInfo.profileImageUrl())
                .build();
        user = userRepository.save(user);

        UserSettings settings = UserSettings.builder()
                .user(user)
                .aiTone("warm")
                .aiEnabled(true)
                .build();
        userSettingsRepository.save(settings);

        TokenResponse tokens = issueTokens(user);
        return new SocialLoginResponse(
                tokens.getAccessToken(),
                tokens.getRefreshToken(),
                true,
                user.getNickname()
        );
    }

    private SocialUserInfo verifyToken(AuthProvider provider, String token) {
        return switch (provider) {
            case GOOGLE, APPLE -> verifyFirebaseToken(token);
            case KAKAO -> verifyKakaoToken(token);
            default -> throw new CustomException(ErrorCode.SOCIAL_AUTH_FAILED);
        };
    }

    private SocialUserInfo verifyFirebaseToken(String idToken) {
        if (FirebaseApp.getApps().isEmpty()) {
            throw new CustomException(ErrorCode.SOCIAL_AUTH_FAILED);
        }
        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            return new SocialUserInfo(
                    decodedToken.getUid(),
                    decodedToken.getEmail(),
                    decodedToken.getName(),
                    decodedToken.getPicture()
            );
        } catch (Exception e) {
            log.error("Firebase token verification failed: {}", e.getMessage());
            throw new CustomException(ErrorCode.SOCIAL_AUTH_FAILED);
        }
    }

    private SocialUserInfo verifyKakaoToken(String accessToken) {
        KakaoTokenVerifier.KakaoUserInfo info = kakaoTokenVerifier.verify(accessToken);
        return new SocialUserInfo(
                info.getId(),
                info.getEmail(),
                info.getNickname(),
                info.getProfileImageUrl()
        );
    }

    private TokenResponse issueTokens(User user) {
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId(), user.getEmail());
        user.updateRefreshToken(refreshToken);
        return new TokenResponse(accessToken, refreshToken);
    }

    private record SocialUserInfo(String uid, String email, String name, String profileImageUrl) {}
}
