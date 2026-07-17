package com.github.mamuriapp.global.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * 웹 MVC 설정.
 * CORS 정책과 정적 리소스 서빙을 구성한다.
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:19006,http://localhost:8081}")
    private String allowedOrigins;

    private final UploadProperties uploadProperties;

    @Value("${admin.cors.allowed-origins:https://admin.mamuri.app}")
    private String adminAllowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Admin API CORS — admin.mamuri.app 전용.
        // 반드시 /api/** 보다 먼저 등록해야 한다: 패턴 매칭이 등록 순서대로 첫 일치를
        // 사용하므로, /api/**가 앞서면 /api/admin/** 요청까지 앱 origin 목록으로
        // 검사되어 admin 대시보드가 403(Invalid CORS request)으로 차단된다.
        registry.addMapping("/api/admin/**")
                .allowedOrigins(adminAllowedOrigins.split(","))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
                .allowedHeaders("Content-Type", "Authorization")
                .allowCredentials(true)
                .maxAge(3600);

        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins.split(","))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
                .allowedHeaders("Content-Type", "Authorization")
                .allowCredentials(true)
                .maxAge(3600);

        registry.addMapping("/uploads/**")
                .allowedOrigins(allowedOrigins.split(","))
                .allowedMethods("GET")
                .maxAge(3600);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadPath = Paths.get(uploadProperties.getDir()).toAbsolutePath().normalize().toUri().toString();
        if (!uploadPath.endsWith("/")) {
            uploadPath += "/";
        }
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath);
    }
}
