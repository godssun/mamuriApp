package com.github.mamuriapp.ai.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * AI 관련 설정 프로퍼티.
 */
@Slf4j
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "ai")
public class AiProperties {

    private String provider = "stub";
    private String promptVersion = "v1";
    private int maxOutputTokens = 180;
    private int maxInputChars = 3000;

    private Api api = new Api();

    @PostConstruct
    void logConfig() {
        boolean hasKey = api.getKey() != null && !api.getKey().isBlank();
        log.info("[AI 설정] provider={}, promptVersion={}, model={}, apiKey존재={}, url={}",
                provider, promptVersion, api.getModel(), hasKey, api.getUrl());
    }

    @Getter
    @Setter
    public static class Api {
        private String url = "https://api.openai.com/v1";
        private String key = "";
        private String model = "gpt-4o-mini";
    }
}
