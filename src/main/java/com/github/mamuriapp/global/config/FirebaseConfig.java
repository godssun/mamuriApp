package com.github.mamuriapp.global.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Firebase Admin SDK 초기화 설정.
 *
 * 인증 파일 로딩 우선순위:
 * 1. FIREBASE_CREDENTIALS_PATH 환경변수 (프로덕션: Docker volume 마운트 경로)
 * 2. classpath의 firebase-service-account.json (로컬 개발)
 *
 * 두 경로 모두 없으면 경고 로그만 출력하고 넘어간다.
 */
@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${FIREBASE_CREDENTIALS_PATH:}")
    private String credentialsPath;

    @PostConstruct
    public void initialize() {
        if (!FirebaseApp.getApps().isEmpty()) {
            log.info("Firebase already initialized.");
            return;
        }

        try {
            InputStream credentialsStream = resolveCredentials();
            if (credentialsStream == null) {
                log.warn("Firebase credentials not found. Google/Apple social login will be unavailable.");
                return;
            }

            try (credentialsStream) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(credentialsStream))
                        .build();
                FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK initialized successfully.");
            }
        } catch (Exception e) {
            log.warn("Failed to initialize Firebase Admin SDK: {}. Google/Apple social login will be unavailable.", e.getMessage());
        }
    }

    private InputStream resolveCredentials() {
        // 1. 환경변수 경로 (프로덕션)
        if (credentialsPath != null && !credentialsPath.isBlank()) {
            Path path = Path.of(credentialsPath);
            if (Files.exists(path)) {
                log.info("Loading Firebase credentials from external path.");
                try {
                    return new FileInputStream(path.toFile());
                } catch (Exception e) {
                    log.warn("Failed to read Firebase credentials from {}: {}", credentialsPath, e.getMessage());
                }
            } else {
                log.warn("FIREBASE_CREDENTIALS_PATH is set but file not found: {}", credentialsPath);
            }
        }

        // 2. classpath 파일 (로컬 개발)
        try {
            var resource = new ClassPathResource("firebase-service-account.json");
            if (resource.exists()) {
                log.info("Loading Firebase credentials from classpath.");
                return resource.getInputStream();
            }
        } catch (Exception e) {
            log.warn("Failed to read Firebase credentials from classpath: {}", e.getMessage());
        }

        return null;
    }
}
