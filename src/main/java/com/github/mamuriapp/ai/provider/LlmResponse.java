package com.github.mamuriapp.ai.provider;

/**
 * LLM 응답 레코드.
 *
 * @param content     생성된 텍스트
 * @param modelName   사용된 모델명
 * @param totalTokens 총 사용 토큰 수
 */
public record LlmResponse(String content, String modelName, int totalTokens) {

    /**
     * 기존 호환용 팩토리 메서드 (totalTokens = 0).
     */
    public LlmResponse(String content, String modelName) {
        this(content, modelName, 0);
    }
}
