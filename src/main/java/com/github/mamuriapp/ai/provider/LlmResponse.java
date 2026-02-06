package com.github.mamuriapp.ai.provider;

/**
 * LLM 응답 레코드.
 *
 * @param content   생성된 텍스트
 * @param modelName 사용된 모델명
 */
public record LlmResponse(String content, String modelName) {
}
