package com.github.mamuriapp.global.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

/**
 * Firebase Admin SDK 초기화 설정.
 * firebase-service-account.json 파일이 없으면 경고 로그만 출력하고 넘어간다.
 */
@Slf4j
@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() {
        if (!FirebaseApp.getApps().isEmpty()) {
            log.info("Firebase already initialized.");
            return;
        }

        try {
            var resource = new ClassPathResource("firebase-service-account.json");
            if (!resource.exists()) {
                log.warn("firebase-service-account.json not found. Google/Apple social login will be unavailable.");
                return;
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(resource.getInputStream()))
                    .build();
            FirebaseApp.initializeApp(options);
            log.info("Firebase Admin SDK initialized successfully.");
        } catch (Exception e) {
            log.warn("Failed to initialize Firebase Admin SDK: {}. Google/Apple social login will be unavailable.", e.getMessage());
        }
    }
}
