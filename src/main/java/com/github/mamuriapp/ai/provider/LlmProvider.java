package com.github.mamuriapp.ai.provider;

/**
 * LLM 공급자 인터페이스.
 * 외부 LLM API 호출을 추상화한다.
 */
public interface LlmProvider {

    /**
     * 프롬프트를 전송하고 AI 응답을 반환한다.
     *
     * @param prompt    전송할 프롬프트 전문
     * @param maxTokens 최대 출력 토큰 수
     * @return LLM 응답
     */
    LlmResponse generate(String prompt, int maxTokens);
}
