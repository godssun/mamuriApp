package com.github.mamuriapp.user.service;

import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Kakao Access Token을 검증하고 사용자 정보를 추출한다.
 */
@Slf4j
@Component
public class KakaoTokenVerifier {

    private static final String KAKAO_USER_INFO_URL = "https://kapi.kakao.com/v2/user/me";
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Kakao Access Token으로 사용자 정보를 조회한다.
     *
     * @param accessToken Kakao access token
     * @return Kakao 사용자 정보
     */
    public KakaoUserInfo verify(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    KAKAO_USER_INFO_URL, HttpMethod.GET, entity, Map.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new CustomException(ErrorCode.SOCIAL_AUTH_FAILED);
            }

            Map<String, Object> body = response.getBody();
            String id = String.valueOf(body.get("id"));

            Map<String, Object> kakaoAccount = (Map<String, Object>) body.get("kakao_account");
            String email = kakaoAccount != null ? (String) kakaoAccount.get("email") : null;

            String nickname = null;
            if (kakaoAccount != null) {
                Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
                if (profile != null) {
                    nickname = (String) profile.get("nickname");
                }
            }

            String profileImageUrl = null;
            if (kakaoAccount != null) {
                Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
                if (profile != null) {
                    profileImageUrl = (String) profile.get("profile_image_url");
                }
            }

            return new KakaoUserInfo(id, email, nickname, profileImageUrl);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Kakao token verification failed: {}", e.getMessage());
            throw new CustomException(ErrorCode.SOCIAL_AUTH_FAILED);
        }
    }

    @Getter
    public static class KakaoUserInfo {
        private final String id;
        private final String email;
        private final String nickname;
        private final String profileImageUrl;

        public KakaoUserInfo(String id, String email, String nickname, String profileImageUrl) {
            this.id = id;
            this.email = email;
            this.nickname = nickname;
            this.profileImageUrl = profileImageUrl;
        }
    }
}
