package com.github.mamuriapp.ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * AI 관련 설정 프로퍼티.
 */
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

    @Getter
    @Setter
    public static class Api {
        private String url = "https://api.openai.com/v1";
        private String key = "";
        private String model = "gpt-4o-mini";
    }
}
