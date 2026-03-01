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

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins.split(","))
                .allowedMethods("GET", "POST", "PUT", "DELETE")
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
