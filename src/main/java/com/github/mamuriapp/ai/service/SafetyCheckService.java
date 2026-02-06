package com.github.mamuriapp.ai.service;

import com.github.mamuriapp.ai.entity.SafetyEvent;
import com.github.mamuriapp.ai.repository.SafetyEventRepository;
import com.github.mamuriapp.diary.entity.Diary;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 안전 검사 서비스.
 * 일기 내용에 위기 신호(자해/자살 등)가 포함되어 있는지 키워드 기반 검사를 수행한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SafetyCheckService {

    private final SafetyEventRepository safetyEventRepository;

    private static final List<String> CRISIS_KEYWORDS = List.of(
            "자살", "자해", "죽고 싶", "죽고싶", "죽을 거",
            "죽을거", "목숨을 끊", "목숨을끊", "끝내고 싶",
            "끝내고싶", "살고 싶지 않", "살고싶지않",
            "세상을 떠나", "세상을떠나"
    );

    /**
     * 일기 내용의 안전 검사를 수행한다.
     * 위기 키워드가 감지되면 SafetyEvent를 기록하고 false를 반환한다.
     *
     * @param diary 검사할 일기
     * @return 안전하면 true, 위기 신호 감지 시 false
     */
    @Transactional
    public boolean check(Diary diary) {
        String content = diary.getContent();
        if (content == null || content.isBlank()) {
            return true;
        }

        String normalized = content.replace(" ", "");
        for (String keyword : CRISIS_KEYWORDS) {
            String normalizedKeyword = keyword.replace(" ", "");
            if (normalized.contains(normalizedKeyword)) {
                recordSafetyEvent(diary, keyword);
                return false;
            }
        }

        return true;
    }

    private void recordSafetyEvent(Diary diary, String matchedKeyword) {
        SafetyEvent event = SafetyEvent.builder()
                .diary(diary)
                .eventType("crisis_keyword")
                .confidenceScore(1.0)
                .actionTaken("safety_response_override (matched: " + matchedKeyword + ")")
                .build();
        safetyEventRepository.save(event);
        log.warn("안전 이벤트 감지 (diaryId={}, keyword={})", diary.getId(), matchedKeyword);
    }
}
