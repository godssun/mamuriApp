package com.github.mamuriapp.ai.service;

import com.github.mamuriapp.ai.entity.UserMemory;
import com.github.mamuriapp.ai.repository.UserMemoryRepository;
import com.github.mamuriapp.diary.entity.Diary;
import com.github.mamuriapp.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * AI 기억 추출 서비스.
 * 일기 내용에서 중요한 정보를 추출하여 기억으로 저장한다.
 *
 * Phase 1: 규칙 기반 추출 (빠르고 안정적)
 * Phase 2: LLM 기반 추출로 확장 예정
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MemoryExtractionService {

    private final UserMemoryRepository memoryRepository;

    // 인물 패턴 (엄마, 아빠, 친구, 동료, 선배, 후배, 남자친구, 여자친구 등)
    private static final Pattern PERSON_PATTERN = Pattern.compile(
            "(엄마|아빠|어머니|아버지|할머니|할아버지|동생|형|누나|오빠|언니|" +
            "남자친구|여자친구|남편|아내|와이프|남친|여친|" +
            "친구|동료|선배|후배|상사|팀장|부장|대리|과장|사장)" +
            "(?:가|이|와|과|에게|한테|께서)?\\s");

    // 관심사/취미 패턴
    private static final Pattern INTEREST_PATTERN = Pattern.compile(
            "(요리|독서|운동|산책|등산|수영|요가|명상|그림|음악|기타|피아노|" +
            "영화|드라마|넷플릭스|유튜브|게임|여행|카페|커피|차|맥주|와인|" +
            "코딩|공부|독서|글쓰기|사진|캠핑|낚시|러닝|자전거)");

    // 주요 이벤트 패턴
    private static final Pattern EVENT_PATTERN = Pattern.compile(
            "(이직|퇴사|입사|취업|졸업|입학|시험|면접|결혼|이사|여행|" +
            "수술|병원|건강검진|생일|기념일|승진|연봉|프로젝트)");

    /**
     * 일기에서 기억을 비동기 추출한다.
     */
    @Async
    @Transactional
    public void extractMemories(Diary diary, User user) {
        try {
            String content = diary.getTitle() + " " + diary.getContent();

            extractByPattern(user, diary, content, PERSON_PATTERN, "PERSON");
            extractByPattern(user, diary, content, INTEREST_PATTERN, "INTEREST");
            extractByPattern(user, diary, content, EVENT_PATTERN, "EVENT");

        } catch (Exception e) {
            log.warn("Memory extraction failed for diary {}: {}", diary.getId(), e.getMessage());
        }
    }

    /**
     * 사용자의 기억 목록을 조회한다.
     */
    @Transactional(readOnly = true)
    public List<UserMemory> getMemories(Long userId) {
        return memoryRepository.findActiveByUserId(userId);
    }

    /**
     * AI 프롬프트용 상위 기억을 조회한다.
     */
    @Transactional(readOnly = true)
    public List<UserMemory> getTopMemories(Long userId, int limit) {
        return memoryRepository.findTopMemories(userId, PageRequest.of(0, limit));
    }

    /**
     * 기억을 삭제(아카이브)한다.
     */
    @Transactional
    public void archiveMemory(Long memoryId, Long userId) {
        UserMemory memory = memoryRepository.findByIdAndUserId(memoryId, userId)
                .orElseThrow(() -> new IllegalArgumentException("기억을 찾을 수 없습니다."));
        memory.archive();
    }

    /**
     * 기억 참조를 기록한다 (AI 응답에서 기억을 사용했을 때).
     */
    @Transactional
    public void markReferencedMemories(List<Long> memoryIds) {
        for (Long id : memoryIds) {
            memoryRepository.findById(id).ifPresent(UserMemory::markReferenced);
        }
    }

    private void extractByPattern(User user, Diary diary, String content,
                                   Pattern pattern, String type) {
        Matcher matcher = pattern.matcher(content);
        while (matcher.find()) {
            String keyword = matcher.group(1);
            List<UserMemory> similar = memoryRepository.findSimilar(user.getId(), type, keyword);

            if (similar.isEmpty()) {
                // 새 기억 생성
                String memoryContent = buildMemoryContent(type, keyword, content, matcher.start());
                UserMemory memory = UserMemory.builder()
                        .user(user)
                        .memoryType(type)
                        .content(memoryContent)
                        .sourceDiary(diary)
                        .importance(1)
                        .build();
                memoryRepository.save(memory);
            } else {
                // 기존 기억 강화
                similar.get(0).incrementMentionCount();
            }
        }
    }

    private String buildMemoryContent(String type, String keyword, String content, int pos) {
        // 키워드 주변 문맥 추출 (전후 30자)
        int start = Math.max(0, pos - 30);
        int end = Math.min(content.length(), pos + keyword.length() + 30);
        String context = content.substring(start, end).trim();

        return switch (type) {
            case "PERSON" -> keyword + "에 대해 언급: " + context;
            case "INTEREST" -> keyword + "에 관심: " + context;
            case "EVENT" -> keyword + " 관련 이벤트: " + context;
            default -> context;
        };
    }
}
