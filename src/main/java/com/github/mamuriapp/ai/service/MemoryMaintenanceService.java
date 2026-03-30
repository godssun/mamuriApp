package com.github.mamuriapp.ai.service;

import com.github.mamuriapp.ai.entity.UserMemory;
import com.github.mamuriapp.ai.repository.UserMemoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * 기억 유지보수 서비스.
 * 주간 배치로 감쇠 평가, 승격/아카이브를 수행한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MemoryMaintenanceService {

    private static final double SHORT_TERM_DECAY_FACTOR = 0.85;
    private static final double MID_TERM_DECAY_FACTOR = 0.95;
    private static final double LONG_TERM_DECAY_FACTOR = 0.99;
    private static final double ARCHIVE_THRESHOLD = 0.1;

    // 승격 기준
    private static final int PROMOTE_TO_MID_TERM_MENTIONS = 3;
    private static final int PROMOTE_TO_LONG_TERM_MENTIONS = 7;
    private static final int PROMOTE_TO_LONG_TERM_IMPORTANCE = 4;

    private final UserMemoryRepository memoryRepository;

    /**
     * 매주 월요일 새벽 4시에 기억 유지보수를 수행한다.
     */
    @Scheduled(cron = "0 0 4 * * MON")
    @Transactional
    public void performMaintenance() {
        List<UserMemory> activeMemories = memoryRepository.findByStatus("ACTIVE");
        int promoted = 0;
        int archived = 0;

        for (UserMemory memory : activeMemories) {
            // 1. 승격 평가
            if (shouldPromote(memory)) {
                String newTier = determineNewTier(memory);
                if (!newTier.equals(memory.getMemoryTier())) {
                    memory.promoteTier(newTier);
                    promoted++;
                }
            }

            // 2. 감쇠 적용
            double decayFactor = getDecayFactor(memory.getMemoryTier());
            memory.applyDecay(decayFactor);

            // 3. 참조된 기억은 감쇠 보상
            if (memory.getLastReferencedAt() != null) {
                long daysSinceRef = ChronoUnit.DAYS.between(
                        memory.getLastReferencedAt().toLocalDate(),
                        LocalDateTime.now().toLocalDate());
                if (daysSinceRef < 7) {
                    memory.applyDecay(1.1); // 감쇠 역전 (약간의 보상)
                }
            }

            // 4. 아카이브 판정
            if (memory.isDecayed(ARCHIVE_THRESHOLD) && !"LONG_TERM".equals(memory.getMemoryTier())) {
                memory.archive();
                archived++;
            }
        }

        if (promoted > 0 || archived > 0) {
            log.info("Memory maintenance: {} promoted, {} archived", promoted, archived);
        }
    }

    private boolean shouldPromote(UserMemory memory) {
        return memory.getMentionCount() >= PROMOTE_TO_MID_TERM_MENTIONS
                || memory.getImportance() >= PROMOTE_TO_LONG_TERM_IMPORTANCE;
    }

    private String determineNewTier(UserMemory memory) {
        if (memory.getMentionCount() >= PROMOTE_TO_LONG_TERM_MENTIONS
                || memory.getImportance() >= PROMOTE_TO_LONG_TERM_IMPORTANCE) {
            return "LONG_TERM";
        }
        if (memory.getMentionCount() >= PROMOTE_TO_MID_TERM_MENTIONS) {
            return "MID_TERM";
        }
        return memory.getMemoryTier();
    }

    private double getDecayFactor(String tier) {
        return switch (tier) {
            case "MID_TERM" -> MID_TERM_DECAY_FACTOR;
            case "LONG_TERM" -> LONG_TERM_DECAY_FACTOR;
            default -> SHORT_TERM_DECAY_FACTOR;
        };
    }
}
