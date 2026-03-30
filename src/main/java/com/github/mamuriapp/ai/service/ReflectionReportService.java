package com.github.mamuriapp.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.mamuriapp.ai.config.AiProperties;
import com.github.mamuriapp.ai.entity.ReflectionReport;
import com.github.mamuriapp.ai.entity.UserMemory;
import com.github.mamuriapp.ai.provider.LlmProvider;
import com.github.mamuriapp.ai.provider.LlmResponse;
import com.github.mamuriapp.ai.repository.ReflectionReportRepository;
import com.github.mamuriapp.ai.repository.UserMemoryRepository;
import com.github.mamuriapp.diary.entity.Diary;
import com.github.mamuriapp.diary.entity.DiaryEmotion;
import com.github.mamuriapp.diary.repository.DiaryEmotionRepository;
import com.github.mamuriapp.diary.repository.DiaryRepository;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.entity.UserSettings;
import com.github.mamuriapp.user.repository.UserRepository;
import com.github.mamuriapp.user.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 리플렉션 리포트 생성 서비스.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReflectionReportService {

    private final ReflectionReportRepository reportRepository;
    private final UserRepository userRepository;
    private final DiaryRepository diaryRepository;
    private final DiaryEmotionRepository emotionRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final UserMemoryRepository userMemoryRepository;
    private final LlmProvider llmProvider;
    private final AiProperties aiProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final int MIN_DIARIES_FOR_WEEKLY = 3;
    private static final int MIN_DIARIES_FOR_MONTHLY = 7;

    /**
     * 매주 일요일 21시에 주간 리포트를 자동 생성한다.
     */
    @Scheduled(cron = "0 0 21 * * SUN")
    @Transactional
    public void generateWeeklyReports() {
        LocalDate weekEnd = LocalDate.now();
        LocalDate weekStart = weekEnd.minusDays(6);

        List<User> users = userRepository.findAll();
        int generated = 0;
        for (User user : users) {
            try {
                if (reportRepository.existsByUserIdAndReportTypeAndPeriodStart(
                        user.getId(), "WEEKLY", weekStart)) {
                    continue;
                }
                boolean success = generateReport(user, "WEEKLY", weekStart, weekEnd);
                if (success) generated++;
            } catch (Exception e) {
                log.warn("Weekly report failed for user {}: {}", user.getId(), e.getMessage());
            }
        }
        log.info("Generated {} weekly reports", generated);
    }

    /**
     * 매월 1일 21시에 월간 리포트를 자동 생성한다.
     */
    @Scheduled(cron = "0 0 21 1 * *")
    @Transactional
    public void generateMonthlyReports() {
        LocalDate monthEnd = LocalDate.now().minusDays(1);
        LocalDate monthStart = monthEnd.withDayOfMonth(1);

        List<User> users = userRepository.findAll();
        int generated = 0;
        for (User user : users) {
            try {
                if (reportRepository.existsByUserIdAndReportTypeAndPeriodStart(
                        user.getId(), "MONTHLY", monthStart)) {
                    continue;
                }
                boolean success = generateReport(user, "MONTHLY", monthStart, monthEnd);
                if (success) generated++;
            } catch (Exception e) {
                log.warn("Monthly report failed for user {}: {}", user.getId(), e.getMessage());
            }
        }
        log.info("Generated {} monthly reports", generated);
    }

    /**
     * 사용자 리포트 목록을 조회한다.
     */
    @Transactional(readOnly = true)
    public List<ReflectionReport> getReports(Long userId) {
        return reportRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * 리포트 상세를 조회한다.
     */
    @Transactional
    public ReflectionReport getReport(Long reportId, Long userId) {
        ReflectionReport report = reportRepository.findByIdAndUserId(reportId, userId)
                .orElseThrow(() -> new IllegalArgumentException("리포트를 찾을 수 없습니다."));
        report.markRead();
        return report;
    }

    /**
     * 수동으로 주간 리포트를 생성한다.
     */
    @Transactional
    public ReflectionReport generateManualWeekly(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        LocalDate weekEnd = LocalDate.now();
        LocalDate weekStart = weekEnd.minusDays(6);
        generateReport(user, "WEEKLY", weekStart, weekEnd);
        return reportRepository.findByUserIdAndReportTypeOrderByPeriodStartDesc(userId, "WEEKLY")
                .stream().findFirst().orElse(null);
    }

    private boolean generateReport(User user, String type, LocalDate start, LocalDate end) {
        // 기간 내 일기 조회
        List<Diary> diaries = diaryRepository.findByUserIdAndDiaryDateBetween(
                user.getId(), start, end);

        int minDiaries = "WEEKLY".equals(type) ? MIN_DIARIES_FOR_WEEKLY : MIN_DIARIES_FOR_MONTHLY;
        if (diaries.size() < minDiaries) {
            return false;
        }

        // 감정 분포
        List<Object[]> emotionDist = emotionRepository.countByEmotionSince(
                user.getId(), start.atStartOfDay());
        Map<String, Object> emotionSummary = emotionDist.stream()
                .collect(Collectors.toMap(
                        r -> (String) r[0],
                        r -> r[1],
                        (a, b) -> a,
                        LinkedHashMap::new));

        // v2: 프롬프트 버전에 따라 템플릿 선택
        String promptVersion = aiProperties.getPromptVersion();
        String templatePath = "v6".equals(promptVersion)
                ? "prompts/weekly_report_v2.txt"
                : "prompts/weekly_report_v1.txt";
        String template = loadTemplate(templatePath);

        UserSettings settings = userSettingsRepository.findByUserId(user.getId()).orElse(null);
        String aiName = user.getAiName() != null ? user.getAiName() : "마음이";
        String userName = user.getNickname() != null ? user.getNickname() : "친구";

        String diariesSummary = diaries.stream()
                .map(d -> {
                    String contentPreview = d.getContent() != null && d.getContent().length() > 100
                            ? d.getContent().substring(0, 100) + "..."
                            : (d.getContent() != null ? d.getContent() : "(스티커/사진 일기)");
                    return String.format("- %s: [%s] %s",
                            d.getDiaryDate(),
                            d.getTitle() != null ? d.getTitle() : d.getDiaryType(),
                            contentPreview);
                })
                .collect(Collectors.joining("\n"));

        String emotionSummaryStr = emotionSummary.isEmpty() ? "(감정 기록 없음)" :
                emotionSummary.entrySet().stream()
                        .map(e -> e.getKey() + ": " + e.getValue() + "회")
                        .collect(Collectors.joining(", "));

        int relStage = Math.max(1, Math.min(7, user.getRelationshipStage()));
        String[] relDescs = {"", "첫 만남", "알아가는 중", "친해진 사이", "깊은 신뢰",
                "소울메이트", "영혼의 동반자", "평생의 친구"};

        String toneMap = settings != null ? switch (settings.getAiTone()) {
            case "calm" -> "차분하고 안정적인 말투";
            case "cheerful" -> "밝고 긍정적인 말투";
            case "realistic" -> "솔직하고 담백한 말투";
            default -> "따뜻하고 공감하는 말투";
        } : "따뜻하고 공감하는 말투";

        String speechStyle = settings != null && "casual".equals(settings.getAiSpeechStyle())
                ? "편안한 반말로 이야기하세요."
                : "반드시 존댓말을 사용하세요.";

        // v2: 이전 리포트 비교
        String previousReportSummary = getPreviousReportSummary(user.getId(), type);

        // v2: 기억 요약
        String memoriesSummary = formatMemoriesForReport(user.getId());

        // v2: 스티커 감정 분포
        String stickerSummary = formatStickerSummary(user.getId(), start);

        String prompt = template
                .replace("{{aiName}}", aiName)
                .replace("{{userName}}", userName)
                .replace("{{toneInstruction}}", toneMap)
                .replace("{{speechStyleInstruction}}", speechStyle)
                .replace("{{relationshipDescription}}", relDescs[relStage])
                .replace("{{diariesSummary}}", diariesSummary)
                .replace("{{emotionSummary}}", emotionSummaryStr)
                .replace("{{stickerSummary}}", stickerSummary)
                .replace("{{previousReportSummary}}", previousReportSummary)
                .replace("{{memories}}", memoriesSummary);

        try {
            LlmResponse response = llmProvider.generate(prompt, 600);
            JsonNode json = objectMapper.readTree(response.content());

            String title = json.has("title") ? json.get("title").asText() : type + " 리포트";
            String content = json.has("content") ? json.get("content").asText() : response.content();
            String growthInsight = json.has("growthInsight") ? json.get("growthInsight").asText() : null;
            List<String> keyEvents = new ArrayList<>();
            if (json.has("keyEvents") && json.get("keyEvents").isArray()) {
                json.get("keyEvents").forEach(n -> keyEvents.add(n.asText()));
            }

            ReflectionReport report = ReflectionReport.builder()
                    .user(user)
                    .reportType(type)
                    .periodStart(start)
                    .periodEnd(end)
                    .title(title)
                    .content(content)
                    .emotionSummary(emotionSummary)
                    .keyEvents(keyEvents)
                    .growthInsight(growthInsight)
                    .diaryCount(diaries.size())
                    .build();

            reportRepository.save(report);
            return true;

        } catch (Exception e) {
            log.warn("LLM report generation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 이전 리포트 요약을 생성한다.
     */
    private String getPreviousReportSummary(Long userId, String type) {
        List<ReflectionReport> previous = reportRepository
                .findByUserIdAndReportTypeOrderByPeriodStartDesc(userId, type);
        if (previous.isEmpty()) {
            return "(이전 리포트 없음 — 첫 리포트입니다)";
        }
        ReflectionReport last = previous.get(0);
        StringBuilder sb = new StringBuilder();
        sb.append("이전 리포트 (").append(last.getPeriodStart()).append(" ~ ").append(last.getPeriodEnd()).append(")\n");
        sb.append("- 제목: ").append(last.getTitle()).append("\n");
        if (last.getGrowthInsight() != null) {
            sb.append("- 성장 인사이트: ").append(last.getGrowthInsight()).append("\n");
        }
        if (last.getEmotionSummary() != null) {
            sb.append("- 감정 분포: ").append(last.getEmotionSummary()).append("\n");
        }
        return sb.toString();
    }

    private String formatMemoriesForReport(Long userId) {
        List<UserMemory> memories = userMemoryRepository.findTopMemories(
                userId, org.springframework.data.domain.PageRequest.of(0, 5));
        if (memories.isEmpty()) return "(기억 없음)";
        return memories.stream()
                .map(m -> "- [" + m.getMemoryType() + "] " + m.getContent())
                .collect(Collectors.joining("\n"));
    }

    private String formatStickerSummary(Long userId, LocalDate since) {
        List<DiaryEmotion> emotions = emotionRepository.findByUserIdSince(userId, since.atStartOfDay());
        long stickerCount = emotions.stream()
                .filter(e -> e.getPrimaryStickerId() != null)
                .count();
        if (stickerCount == 0) return "(스티커 감정 기록 없음)";
        return "스티커로 기록한 감정: " + stickerCount + "건";
    }

    private String loadTemplate(String path) {
        try {
            return new ClassPathResource(path).getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load template: " + path, e);
        }
    }
}
