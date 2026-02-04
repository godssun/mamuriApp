package com.github.mamuriapp.ai.service;

import com.github.mamuriapp.ai.entity.SafetyEvent;
import com.github.mamuriapp.ai.repository.SafetyEventRepository;
import com.github.mamuriapp.diary.entity.Diary;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 안전 검사 서비스 (MVP-lite).
 * 일기 내용에 위기 신호가 포함되어 있는지 경량 검사를 수행한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SafetyCheckService {

    private final SafetyEventRepository safetyEventRepository;

    /**
     * 일기 내용의 안전 검사를 수행한다.
     * MVP에서는 키워드 기반 경량 검사를 사용한다.
     *
     * @param diary 검사할 일기
     * @return 위기 신호가 감지되면 true
     */
    @Transactional
    public boolean check(Diary diary) {
        // TODO: MVP-lite 구현 - 키워드 기반 경량 검사
        // 향후 AI 기반 분류기로 교체 예정
        boolean isSafe = true;

        if (!isSafe) {
            SafetyEvent event = SafetyEvent.builder()
                    .diary(diary)
                    .eventType("keyword_match")
                    .confidenceScore(0.0)
                    .actionTaken("safety_response_override")
                    .build();
            safetyEventRepository.save(event);
            log.warn("안전 이벤트 감지 (diaryId={})", diary.getId());
        }

        return isSafe;
    }
}
