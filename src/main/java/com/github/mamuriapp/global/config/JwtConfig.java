package com.github.mamuriapp.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * JWT 관련 설정값을 application.yml에서 바인딩한다.
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {

    /** JWT 서명에 사용할 시크릿 키 */
    private String secret;

    /** 액세스 토큰 만료 시간 (밀리초) */
    private long accessExpiration;

    /** 리프레시 토큰 만료 시간 (밀리초) */
    private long refreshExpiration;
}
