package com.github.mamuriapp.global.ratelimit;

import lombok.Getter;

/**
 * Rate Limit 초과 예외.
 * Retry-After 초 정보를 포함한다.
 */
@Getter
public class RateLimitExceededException extends RuntimeException {

    /** 재시도까지 대기해야 하는 초 */
    private final long retryAfterSeconds;

    public RateLimitExceededException(long retryAfterSeconds) {
        super("요청이 너무 빈번합니다. " + retryAfterSeconds + "초 후 다시 시도해주세요.");
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
