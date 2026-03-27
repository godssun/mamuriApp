package com.github.mamuriapp.user.service;

import com.github.mamuriapp.ai.repository.UserMemoryRepository;
import com.github.mamuriapp.diary.repository.ConversationMessageRepository;
import com.github.mamuriapp.diary.repository.DiaryEmotionRepository;
import com.github.mamuriapp.diary.repository.DiaryRepository;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * 관계 단계 진화 서비스.
 * 복합 지표 기반으로 사용자와 AI 동반자의 관계 단계를 자동 평가한다.
 *
 * Stage 1: 첫 만남 (기본)
 * Stage 2: 알아가는 중 (일기 5+, 7일+)
 * Stage 3: 친해진 사이 (일기 15+, 대화 20+, 30일+)
 * Stage 4: 깊은 신뢰 (일기 30+, 대화 50+, 감정 다양 4+, 90일+)
 * Stage 5: 소울메이트 (일기 50+, 대화 100+, 180일+)
 * Stage 6: 영혼의 동반자 (일기 80+, 기억 20+, 자기개방 10+, 270일+)
 * Stage 7: 평생의 친구 (일기 120+, 기억 40+, 365일+)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RelationshipService {

    private static final int REGRESSION_INACTIVE_DAYS = 30;

    private final UserRepository userRepository;
    private final DiaryRepository diaryRepository;
    private final ConversationMessageRepository conversationMessageRepository;
    private final DiaryEmotionRepository diaryEmotionRepository;
    private final UserMemoryRepository userMemoryRepository;

    /**
     * 매일 새벽 3시에 전체 사용자의 관계 단계를 재평가한다.
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void evaluateAllRelationships() {
        List<User> users = userRepository.findAll();
        int upgraded = 0;
        int regressed = 0;
        for (User user : users) {
            // 후퇴 체크
            if (checkRegression(user)) {
                regressed++;
                continue;
            }
            int newStage = calculateStage(user);
            if (newStage > user.getRelationshipStage()) {
                user.advanceRelationshipStage(newStage);
                upgraded++;
            }
        }
        if (upgraded > 0 || regressed > 0) {
            log.info("Relationship: {} upgraded, {} regressed", upgraded, regressed);
        }
    }

    /**
     * 특정 사용자의 관계 단계를 즉시 평가한다.
     */
    @Transactional
    public int evaluateAndUpdate(User user) {
        if (checkRegression(user)) {
            return user.getRelationshipStage();
        }
        int newStage = calculateStage(user);
        if (newStage > user.getRelationshipStage()) {
            user.advanceRelationshipStage(newStage);
        }
        return user.getRelationshipStage();
    }

    /**
     * 30일 이상 미사용 시 관계 단계를 후퇴시킨다.
     */
    private boolean checkRegression(User user) {
        if (user.getLastActiveAt() == null) return false;

        long daysInactive = ChronoUnit.DAYS.between(
                user.getLastActiveAt().toLocalDate(), LocalDate.now());

        if (daysInactive >= REGRESSION_INACTIVE_DAYS && user.getRelationshipStage() > 1) {
            // 30일마다 1단계씩 후퇴, 최소 1
            int stagesDrop = (int) (daysInactive / REGRESSION_INACTIVE_DAYS);
            int newStage = Math.max(1, user.getRelationshipStage() - stagesDrop);
            if (newStage < user.getRelationshipStage()) {
                user.regressRelationshipStage(newStage);
                log.info("User {} relationship regressed to stage {} ({}d inactive)",
                        user.getId(), newStage, daysInactive);
                return true;
            }
        }
        return false;
    }

    private int calculateStage(User user) {
        long diaryCount = user.getDiaryCount();
        long daysSinceJoin = ChronoUnit.DAYS.between(
                user.getCreatedAt().toLocalDate(), LocalDate.now());

        // 대화 턴 수 (USER 메시지만)
        long conversationTurns = conversationMessageRepository.countByUserIdAndRoleAndCreatedAtAfter(
                user.getId(), "USER", user.getCreatedAt());

        // 감정 다양성 (고유 감정 수)
        long emotionDiversity = diaryEmotionRepository.countByEmotionSince(
                user.getId(), user.getCreatedAt()).size();

        // 기억 수
        long memoryCount = userMemoryRepository.countByUserIdAndStatus(user.getId(), "ACTIVE");

        // Stage 7
        if (diaryCount >= 120 && memoryCount >= 40 && daysSinceJoin >= 365) {
            return 7;
        }
        // Stage 6
        if (diaryCount >= 80 && memoryCount >= 20 && daysSinceJoin >= 270) {
            return 6;
        }
        // Stage 5
        if (diaryCount >= 50 && conversationTurns >= 100 && daysSinceJoin >= 180) {
            return 5;
        }
        // Stage 4
        if (diaryCount >= 30 && conversationTurns >= 50 && emotionDiversity >= 4 && daysSinceJoin >= 90) {
            return 4;
        }
        // Stage 3
        if (diaryCount >= 15 && conversationTurns >= 20 && daysSinceJoin >= 30) {
            return 3;
        }
        // Stage 2
        if (diaryCount >= 5 && daysSinceJoin >= 7) {
            return 2;
        }
        return 1;
    }
}
