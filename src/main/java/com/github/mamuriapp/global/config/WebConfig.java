package com.github.mamuriapp.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 웹 MVC 설정.
 * CORS 정책을 구성한다.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * CORS 매핑을 등록한다.
     * 개발 환경에서 React Native 클라이언트의 접근을 허용한다.
     *
     * @param registry CorsRegistry
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
                .allowedHeaders("*");
    }
}
