package com.github.mamuriapp.user.service;

import com.github.mamuriapp.ai.entity.UserMemory;
import com.github.mamuriapp.ai.repository.UserMemoryRepository;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Random;

/**
 * 동반자 메시지 서비스.
 * 사용자 상태에 따라 적절한 동반자 메시지를 생성한다.
 * 부재 기간별 5단계 분기 + 기억 기반 개인화.
 */
@Service
@RequiredArgsConstructor
public class CompanionMessageService {

    private final UserRepository userRepository;
    private final UserMemoryRepository userMemoryRepository;
    private final Random random = new Random();

    /**
     * 사용자 상태에 맞는 동반자 메시지를 반환한다.
     */
    @Transactional(readOnly = true)
    public CompanionMessage getMessage(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return defaultMessage();

        long daysAbsent = getDaysAbsent(user);
        boolean hasWrittenToday = user.getLastDiaryDate() != null
                && user.getLastDiaryDate().equals(LocalDate.now());

        // 5단계 복귀 메시지 (기억 기반 개인화)
        if (daysAbsent >= 30) {
            String memoryHint = getMemoryHint(userId);
            return new CompanionMessage(
                    "LONG_ABSENCE",
                    daysAbsent + "일 만이네요... 정말 보고 싶었어요.",
                    memoryHint != null
                            ? "그때 " + memoryHint + " 이야기 기억나요. 요즘은 어떠세요?"
                            : "그동안 어떻게 지냈는지 궁금했어요.",
                    "emotional"
            );
        }
        if (daysAbsent >= 14) {
            String memoryHint = getMemoryHint(userId);
            return new CompanionMessage(
                    "MISS_YOU",
                    "2주 넘게 만나지 못했네요. 많이 바쁘셨나 봐요.",
                    memoryHint != null
                            ? memoryHint + " 이야기가 궁금했어요."
                            : "짧게라도 오늘 기분 남겨볼까요?",
                    "worried"
            );
        }
        if (daysAbsent >= 7) {
            return new CompanionMessage(
                    "RETURN",
                    daysAbsent + "일 만이에요! 보고 싶었어요.",
                    "그동안 어떻게 지냈어요?",
                    "worried"
            );
        }
        if (daysAbsent >= 3) {
            return new CompanionMessage(
                    "GENTLE_RETURN",
                    "요즘 바쁘신가 봐요. 괜찮아요?",
                    "오늘 기분이라도 살짝 남겨볼까요?",
                    "curious"
            );
        }
        if (daysAbsent >= 1) {
            return new CompanionMessage(
                    "YESTERDAY_MISSED",
                    "어제는 일기를 안 쓰셨네요. 바빴나 봐요!",
                    "오늘은 어떤 하루였어요?",
                    "curious"
            );
        }

        // 오늘 이미 작성
        if (hasWrittenToday) {
            return pick(AFTER_WRITE_MESSAGES);
        }

        // 스트릭 기반
        if (user.getCurrentStreak() >= 7) {
            return new CompanionMessage(
                    "STREAK_CELEBRATE",
                    user.getCurrentStreak() + "일 연속 작성 중이에요! 대단해요!",
                    "오늘도 이야기 들려주세요.",
                    "proud"
            );
        }

        // 시간대별 기본 메시지
        return pick(getTimeBasedMessages());
    }

    /**
     * 복귀 상태 정보를 반환한다.
     */
    @Transactional(readOnly = true)
    public ReturnStatus getReturnStatus(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return new ReturnStatus(false, 0);
        long daysAbsent = getDaysAbsent(user);
        return new ReturnStatus(daysAbsent >= 3, (int) daysAbsent);
    }

    /**
     * 기억 기반 개인화 힌트를 가져온다.
     */
    private String getMemoryHint(Long userId) {
        List<UserMemory> memories = userMemoryRepository.findTopMemories(
                userId, PageRequest.of(0, 3));
        if (memories.isEmpty()) return null;
        UserMemory top = memories.get(random.nextInt(memories.size()));
        // 키워드만 추출 (첫 번째 단어 또는 간략한 내용)
        String content = top.getContent();
        int cutoff = content.indexOf("에 대해");
        if (cutoff > 0) return content.substring(0, cutoff);
        return content.length() > 20 ? content.substring(0, 20) : content;
    }

    private long getDaysAbsent(User user) {
        LocalDateTime lastActive = user.getLastActiveAt();
        if (lastActive == null) {
            lastActive = user.getCreatedAt();
        }
        return ChronoUnit.DAYS.between(lastActive.toLocalDate(), LocalDate.now());
    }

    private CompanionMessage pick(List<CompanionMessage> messages) {
        return messages.get(random.nextInt(messages.size()));
    }

    private CompanionMessage defaultMessage() {
        return new CompanionMessage("DEFAULT", "오늘도 이야기 들려주세요.", null, "happy");
    }

    private List<CompanionMessage> getTimeBasedMessages() {
        int hour = LocalDateTime.now().getHour();
        if (hour < 12) return MORNING_MESSAGES;
        if (hour < 18) return AFTERNOON_MESSAGES;
        return EVENING_MESSAGES;
    }

    private static final List<CompanionMessage> MORNING_MESSAGES = List.of(
            new CompanionMessage("MORNING", "좋은 아침이에요!", "오늘 하루 계획이 있나요?", "happy"),
            new CompanionMessage("MORNING", "잘 주무셨어요?", "오늘도 좋은 하루 보내세요.", "curious"),
            new CompanionMessage("MORNING", "새로운 하루가 시작됐어요!", "오늘은 어떤 하루가 될까요?", "happy")
    );

    private static final List<CompanionMessage> AFTERNOON_MESSAGES = List.of(
            new CompanionMessage("AFTERNOON", "오후도 힘내요!", "오늘 중간 기분은 어떤가요?", "happy"),
            new CompanionMessage("AFTERNOON", "점심은 맛있게 드셨나요?", "남은 하루도 파이팅이에요.", "curious")
    );

    private static final List<CompanionMessage> EVENING_MESSAGES = List.of(
            new CompanionMessage("EVENING", "오늘 하루 수고 많으셨어요.", "오늘 하루는 어떠셨어요?", "happy"),
            new CompanionMessage("EVENING", "하루를 마무리할 시간이에요.", "오늘 기억에 남는 일이 있나요?", "curious"),
            new CompanionMessage("EVENING", "편안한 저녁이에요.", "오늘 기분을 기록해볼까요?", "happy")
    );

    private static final List<CompanionMessage> AFTER_WRITE_MESSAGES = List.of(
            new CompanionMessage("AFTER_WRITE", "오늘 일기 잘 읽었어요!", "내일도 이야기 들려주세요.", "proud"),
            new CompanionMessage("AFTER_WRITE", "이야기 들려줘서 고마워요.", "오늘도 수고 많으셨어요.", "happy")
    );

    public record CompanionMessage(String type, String message, String subMessage, String mood) {}
    public record ReturnStatus(boolean isReturning, int daysAbsent) {}
}
