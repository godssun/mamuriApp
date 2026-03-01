package com.github.mamuriapp.ai.service;

import com.github.mamuriapp.diary.entity.Diary;
import com.github.mamuriapp.diary.repository.DiaryRepository;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.entity.UserSettings;
import com.github.mamuriapp.user.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import com.github.mamuriapp.diary.entity.ConversationMessage;

import java.util.List;
import java.util.Map;

/**
 * AI 프롬프트 조립기.
 * 사용자 정보, 설정, 최근 일기 등을 바탕으로 개인화된 프롬프트를 생성한다.
 */
@Component
@RequiredArgsConstructor
public class PromptBuilder {

    private static final int RECENT_DIARY_COUNT = 5;
    private static final int DIARY_SUMMARY_MAX_CHARS = 80;

    private static final Map<String, String> TONE_MAP = Map.of(
            "warm", "따뜻하고 공감하며 위로하는 말투로 이야기해 줘",
            "calm", "차분하고 안정적이며 담담한 말투로 이야기해 줘",
            "cheerful", "밝고 긍정적이며 활기찬 말투로 이야기해 줘",
            "realistic", "솔직하고 현실적이며 담백한 말투로 이야기해 줘. 공감하되 사실 기반으로 말해 줘"
    );

    private static final Map<String, String> SPEECH_STYLE_MAP = Map.of(
            "formal", "반드시 존댓말(높임말)을 사용하세요.",
            "casual", "편안한 반말로 친구처럼 이야기하세요. 단, 무례하거나 거칠지 않게."
    );

    private static final String[] LEVEL_DESCRIPTIONS = {
            "",                         // index 0 (unused)
            "이제 막 만난 사이",          // Lv.1
            "조금씩 마음을 열고 있는 사이", // Lv.2
            "서로가 조금 익숙해진 사이",    // Lv.3
            "매일이 기대되는 사이",        // Lv.4
            "함께 성장하고 있는 사이",     // Lv.5
            "서로의 이야기를 잘 아는 사이", // Lv.6
            "깊은 대화가 가능한 사이",     // Lv.7
            "든든한 존재가 된 사이",       // Lv.8
            "특별한 유대를 느끼는 사이",    // Lv.9
            "최고의 친구"                // Lv.10
    };

    private final UserSettingsRepository userSettingsRepository;
    private final DiaryRepository diaryRepository;

    /**
     * 개인화된 프롬프트를 조립한다.
     * aiEnabled=false인 경우 null을 반환한다 (UserSettings 조회 1회로 통합).
     *
     * @param template       프롬프트 템플릿
     * @param user           사용자 엔티티
     * @param diary          대상 일기
     * @param maxContentChars 일기 본문 최대 글자 수
     * @return 조립된 프롬프트 문자열 (AI 비활성화 시 null)
     */
    public String build(String template, User user, Diary diary, int maxContentChars) {
        UserSettings settings = userSettingsRepository.findByUserId(user.getId())
                .orElse(null);

        if (settings != null && !settings.isAiEnabled()) {
            return null;
        }

        String aiName = user.getAiName() != null ? user.getAiName() : "마음이";
        String userName = user.getNickname() != null ? user.getNickname() : "친구";
        String toneInstruction = mapTone(settings);
        int level = Math.max(1, user.getMaxLevel());
        String levelDescription = mapLevel(level);

        List<Diary> recentDiaries = diaryRepository
                .findTop5ByUserIdAndIdNotOrderByCreatedAtDesc(user.getId(), diary.getId());
        String recentContext = formatRecentDiaries(recentDiaries);

        String content = truncate(diary.getContent(), maxContentChars);

        String speechStyleInstruction = mapSpeechStyle(settings);

        return template
                .replace("{{aiName}}", aiName)
                .replace("{{userName}}", userName)
                .replace("{{toneInstruction}}", toneInstruction)
                .replace("{{speechStyleInstruction}}", speechStyleInstruction)
                .replace("{{level}}", String.valueOf(level))
                .replace("{{levelDescription}}", levelDescription)
                .replace("{{recentDiaries}}", recentContext)
                .replace("{{content}}", content);
    }

    private String mapTone(UserSettings settings) {
        if (settings == null) {
            return TONE_MAP.get("warm");
        }
        return TONE_MAP.getOrDefault(settings.getAiTone(), TONE_MAP.get("warm"));
    }

    private String mapSpeechStyle(UserSettings settings) {
        if (settings == null) {
            return SPEECH_STYLE_MAP.get("formal");
        }
        return SPEECH_STYLE_MAP.getOrDefault(settings.getAiSpeechStyle(), SPEECH_STYLE_MAP.get("formal"));
    }

    private String mapLevel(int level) {
        if (level < 1 || level >= LEVEL_DESCRIPTIONS.length) {
            return LEVEL_DESCRIPTIONS[1];
        }
        return LEVEL_DESCRIPTIONS[level];
    }

    private String formatRecentDiaries(List<Diary> diaries) {
        if (diaries == null || diaries.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder("\n[최근 일기 기록 (참고용)]\n");
        for (Diary d : diaries) {
            String summary = d.getContent().length() > DIARY_SUMMARY_MAX_CHARS
                    ? d.getContent().substring(0, DIARY_SUMMARY_MAX_CHARS) + "..."
                    : d.getContent();
            sb.append("- ").append(d.getDiaryDate()).append(": ").append(summary).append("\n");
        }
        return sb.toString();
    }

    /**
     * 대화형 프롬프트를 조립한다.
     * 일기 원문과 대화 이력을 포함하여 AI가 대화를 이어갈 수 있도록 한다.
     *
     * @param template       대화 프롬프트 템플릿
     * @param user           사용자 엔티티
     * @param diary          대상 일기
     * @param history        대화 이력 (시간순)
     * @param maxContentChars 일기 본문 최대 글자 수
     * @return 조립된 프롬프트 문자열 (AI 비활성화 시 null)
     */
    public String buildConversationPrompt(String template, User user, Diary diary,
                                           List<ConversationMessage> history, int maxContentChars) {
        UserSettings settings = userSettingsRepository.findByUserId(user.getId())
                .orElse(null);

        if (settings != null && !settings.isAiEnabled()) {
            return null;
        }

        String aiName = user.getAiName() != null ? user.getAiName() : "마음이";
        String userName = user.getNickname() != null ? user.getNickname() : "친구";
        String toneInstruction = mapTone(settings);
        int level = Math.max(1, user.getMaxLevel());
        String levelDescription = mapLevel(level);
        String speechStyleInstruction = mapSpeechStyle(settings);
        String content = truncate(diary.getContent(), maxContentChars);
        String conversationHistory = formatConversationHistory(history);

        return template
                .replace("{{aiName}}", aiName)
                .replace("{{userName}}", userName)
                .replace("{{toneInstruction}}", toneInstruction)
                .replace("{{speechStyleInstruction}}", speechStyleInstruction)
                .replace("{{level}}", String.valueOf(level))
                .replace("{{levelDescription}}", levelDescription)
                .replace("{{content}}", content)
                .replace("{{conversationHistory}}", conversationHistory);
    }

    private String formatConversationHistory(List<ConversationMessage> history) {
        if (history == null || history.isEmpty()) {
            return "(아직 대화 없음)";
        }
        StringBuilder sb = new StringBuilder();
        for (ConversationMessage msg : history) {
            String speaker = "AI".equals(msg.getRole()) ? "AI" : "사용자";
            sb.append(speaker).append(": ").append(msg.getContent()).append("\n");
        }
        return sb.toString();
    }

    private String truncate(String text, int maxChars) {
        if (text == null || text.length() <= maxChars) {
            return text;
        }
        return text.substring(0, maxChars);
    }
}
