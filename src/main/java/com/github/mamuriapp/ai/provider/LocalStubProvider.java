package com.github.mamuriapp.ai.provider;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 로컬 테스트용 LLM 스텁 프로바이더.
 * ai.provider=stub (기본값) 일 때 활성화된다.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "ai.provider", havingValue = "stub", matchIfMissing = true)
public class LocalStubProvider implements LlmProvider {

    private static final String MODEL_NAME = "local-stub";

    @Override
    public LlmResponse generate(String prompt, int maxTokens) {
        log.debug("LocalStubProvider 호출 (maxTokens={})", maxTokens);

        String content = "오늘 하루도 정말 수고 많으셨어요. "
                + "일기를 통해 마음을 나눠 주셔서 감사해요. "
                + "내일도 좋은 하루가 되시길 바랄게요.";

        return new LlmResponse(content, MODEL_NAME);
    }
}
