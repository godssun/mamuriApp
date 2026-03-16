package com.github.mamuriapp.global.ratelimit;

import com.github.mamuriapp.user.entity.SubscriptionTier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.Iterator;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * 인메모리 대화 Rate Limiter.
 * 슬라이딩 윈도우 방식으로 티어별 분당/시간당 요청을 제한한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationRateLimiter {

    private static final Duration ONE_MINUTE = Duration.ofMinutes(1);
    private static final Duration ONE_HOUR = Duration.ofHours(1);

    private final RateLimitProperties properties;
    private final ConcurrentHashMap<Long, Deque<Instant>> requestHistory = new ConcurrentHashMap<>();

    /**
     * Rate limit을 확인하고, 초과 시 예외를 발생시킨다.
     *
     * @param userId 사용자 ID
     * @param tier   구독 티어
     * @throws RateLimitExceededException Rate limit 초과 시
     */
    public void checkRateLimit(Long userId, SubscriptionTier tier) {
        if (!properties.isEnabled()) {
            return;
        }

        RateLimitProperties.TierLimit limit = properties.getLimit(tier);
        Deque<Instant> history = requestHistory.computeIfAbsent(userId, k -> new ConcurrentLinkedDeque<>());
        Instant now = Instant.now();

        // 1시간 이전 기록 정리
        cleanExpired(history, now);

        // 분당 제한 확인
        long lastMinuteCount = countSince(history, now.minus(ONE_MINUTE));
        if (lastMinuteCount >= limit.getPerMinute()) {
            long retryAfter = computeRetryAfter(history, now, ONE_MINUTE, limit.getPerMinute());
            log.info("[RateLimit] 분당 제한 초과 (userId={}, tier={}, count={}/{})",
                    userId, tier, lastMinuteCount, limit.getPerMinute());
            throw new RateLimitExceededException(retryAfter);
        }

        // 시간당 제한 확인
        long lastHourCount = history.size();
        if (lastHourCount >= limit.getPerHour()) {
            long retryAfter = computeRetryAfter(history, now, ONE_HOUR, limit.getPerHour());
            log.info("[RateLimit] 시간당 제한 초과 (userId={}, tier={}, count={}/{})",
                    userId, tier, lastHourCount, limit.getPerHour());
            throw new RateLimitExceededException(retryAfter);
        }

        // 요청 기록
        history.addLast(now);
    }

    /**
     * 특정 사용자의 요청 기록을 초기화한다 (테스트용).
     *
     * @param userId 사용자 ID
     */
    public void resetUser(Long userId) {
        requestHistory.remove(userId);
    }

    private void cleanExpired(Deque<Instant> history, Instant now) {
        Instant cutoff = now.minus(ONE_HOUR);
        while (!history.isEmpty() && history.peekFirst().isBefore(cutoff)) {
            history.pollFirst();
        }
    }

    private long countSince(Deque<Instant> history, Instant since) {
        long count = 0;
        Iterator<Instant> it = history.descendingIterator();
        while (it.hasNext()) {
            if (it.next().isAfter(since)) {
                count++;
            } else {
                break;
            }
        }
        return count;
    }

    private long computeRetryAfter(Deque<Instant> history, Instant now, Duration window, int limit) {
        // 윈도우 내 가장 오래된 요청이 만료되는 시점까지 대기
        Instant windowStart = now.minus(window);
        Instant oldest = null;
        int count = 0;

        for (Instant ts : history) {
            if (ts.isAfter(windowStart)) {
                if (count == 0) {
                    oldest = ts;
                }
                count++;
                if (count >= limit) {
                    break;
                }
            }
        }

        if (oldest == null) {
            return 1;
        }

        long seconds = Duration.between(now, oldest.plus(window)).getSeconds();
        return Math.max(1, seconds);
    }
}
