package com.github.mamuriapp.user.service;

import com.github.mamuriapp.user.entity.PushToken;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.repository.PushTokenRepository;
import com.github.mamuriapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

/**
 * 푸시 알림 서비스.
 * Expo Push Notification API를 사용하여 알림을 전송한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PushNotificationService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
    private final PushTokenRepository pushTokenRepository;
    private final UserRepository userRepository;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * 푸시 토큰을 등록한다.
     */
    @Transactional
    public void registerToken(Long userId, String token, String platform) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        pushTokenRepository.findByUserIdAndToken(userId, token)
                .ifPresentOrElse(
                        PushToken::enable,
                        () -> pushTokenRepository.save(PushToken.builder()
                                .user(user)
                                .token(token)
                                .platform(platform)
                                .build())
                );
    }

    /**
     * 푸시 토큰을 해제한다.
     */
    @Transactional
    public void unregisterToken(Long userId, String token) {
        pushTokenRepository.findByUserIdAndToken(userId, token)
                .ifPresent(PushToken::disable);
    }

    /**
     * 매일 20시에 오늘 일기를 쓰지 않은 사용자에게 알림을 전송한다.
     */
    @Scheduled(cron = "0 0 20 * * *")
    public void sendDailyReminders() {
        List<PushToken> tokens = pushTokenRepository.findInactiveUserTokens(12);
        int sent = 0;
        for (PushToken pt : tokens) {
            try {
                String aiName = pt.getUser().getAiName() != null ? pt.getUser().getAiName() : "마음이";
                sendPush(pt.getToken(),
                        aiName + "가 기다리고 있어요",
                        "오늘 하루는 어떠셨어요? 기분을 남겨보세요 💚");
                sent++;
            } catch (Exception e) {
                log.debug("Push failed for token {}: {}", pt.getId(), e.getMessage());
            }
        }
        if (sent > 0) {
            log.info("Sent {} daily reminder push notifications", sent);
        }
    }

    /**
     * Expo Push API로 알림을 전송한다.
     */
    public void sendPush(String expoPushToken, String title, String body) {
        if (expoPushToken == null || !expoPushToken.startsWith("ExponentPushToken")) {
            return;
        }

        String json = String.format(
                "{\"to\":\"%s\",\"title\":\"%s\",\"body\":\"%s\",\"sound\":\"default\"}",
                expoPushToken, escapeJson(title), escapeJson(body));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(EXPO_PUSH_URL))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        try {
            httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                    .thenAccept(r -> {
                        if (r.statusCode() != 200) {
                            log.warn("Expo push response: {} {}", r.statusCode(), r.body());
                        }
                    });
        } catch (Exception e) {
            log.warn("Push send failed: {}", e.getMessage());
        }
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
