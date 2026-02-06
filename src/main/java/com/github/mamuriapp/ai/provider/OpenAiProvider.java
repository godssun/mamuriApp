package com.github.mamuriapp.ai.provider;

import com.github.mamuriapp.ai.config.AiProperties;
import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * OpenAI API 기반 LLM 프로바이더.
 * ai.provider=openai 일 때 활성화된다.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "ai.provider", havingValue = "openai")
public class OpenAiProvider implements LlmProvider {

    private final AiProperties aiProperties;
    private final RestClient restClient;

    public OpenAiProvider(AiProperties aiProperties) {
        this.aiProperties = aiProperties;
        this.restClient = RestClient.builder()
                .baseUrl(aiProperties.getApi().getUrl())
                .defaultHeader("Authorization", "Bearer " + aiProperties.getApi().getKey())
                .build();
    }

    @Override
    public LlmResponse generate(String prompt, int maxTokens) {
        String model = aiProperties.getApi().getModel();
        log.debug("OpenAI API 호출 (model={}, maxTokens={})", model, maxTokens);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "max_tokens", maxTokens,
                "temperature", 0.7
        );

        try {
            Map<?, ?> response = restClient.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            String content = extractContent(response);
            return new LlmResponse(content, model);
        } catch (Exception e) {
            log.error("OpenAI API 호출 실패: {}", e.getMessage(), e);
            throw new CustomException(ErrorCode.AI_SERVICE_ERROR);
        }
    }

    @SuppressWarnings("unchecked")
    private String extractContent(Map<?, ?> response) {
        if (response == null) {
            throw new CustomException(ErrorCode.AI_SERVICE_ERROR);
        }
        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        if (choices == null || choices.isEmpty()) {
            throw new CustomException(ErrorCode.AI_SERVICE_ERROR);
        }
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        if (message == null || message.get("content") == null) {
            throw new CustomException(ErrorCode.AI_SERVICE_ERROR);
        }
        return ((String) message.get("content")).trim();
    }
}
