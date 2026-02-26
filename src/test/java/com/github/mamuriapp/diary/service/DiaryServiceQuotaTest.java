package com.github.mamuriapp.diary.service;

import com.github.mamuriapp.ai.dto.AiCommentResponse;
import com.github.mamuriapp.ai.service.AiCommentService;
import com.github.mamuriapp.ai.service.SafetyCheckService;
import com.github.mamuriapp.diary.dto.DiaryCreateRequest;
import com.github.mamuriapp.diary.dto.DiaryResponse;
import com.github.mamuriapp.diary.entity.Diary;
import com.github.mamuriapp.diary.repository.DiaryRepository;
import com.github.mamuriapp.global.config.FeatureFlags;
import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.user.entity.SubscriptionStatus;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.repository.UserRepository;
import com.github.mamuriapp.user.service.CompanionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * DiaryService 쿼터/안전 로직 단위 테스트 (P0 안전 테스트).
 */
@ExtendWith(MockitoExtension.class)
class DiaryServiceQuotaTest {

    @InjectMocks
    private DiaryService diaryService;

    @Mock
    private DiaryRepository diaryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AiCommentService aiCommentService;

    @Mock
    private SafetyCheckService safetyCheckService;

    @Mock
    private CompanionService companionService;

    @Mock
    private FeatureFlags featureFlags;

    private User testUser;
    private DiaryCreateRequest request;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("test@example.com")
                .password("encoded")
                .nickname("테스트")
                .build();
        ReflectionTestUtils.setField(testUser, "id", 1L);

        request = new DiaryCreateRequest();
        ReflectionTestUtils.setField(request, "title", "오늘의 일기");
        ReflectionTestUtils.setField(request, "content", "오늘은 좋은 하루였다.");
        ReflectionTestUtils.setField(request, "diaryDate", LocalDate.now());
    }

    // --- Helper ---

    private void stubUserFound() {
        given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
    }

    private void stubDiarySaved() {
        given(diaryRepository.save(any(Diary.class))).willAnswer(invocation -> {
            Diary saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 100L);
            return saved;
        });
    }

    private void setQuotaUsed(int count) {
        ReflectionTestUtils.setField(testUser, "quotaUsed", count);
    }

    private void enableQuotaEnforcement() {
        given(featureFlags.isQuotaEnforcementEnabled()).willReturn(true);
    }

    private void disableQuotaEnforcement() {
        given(featureFlags.isQuotaEnforcementEnabled()).willReturn(false);
    }

    private void stubSafetyCheckSafe() {
        given(safetyCheckService.check(any(Diary.class))).willReturn(true);
    }

    private void stubSafetyCheckCrisis() {
        given(safetyCheckService.check(any(Diary.class))).willReturn(false);
    }

    private AiCommentResponse createAiCommentResponse() {
        return new AiCommentResponse(1L, "좋은 하루였군요!", LocalDateTime.now());
    }

    // --- P0: 위기 사용자 안전 보장 ---

    @Nested
    @DisplayName("P0 안전: 위기 사용자 보호")
    class CrisisUserSafety {

        @Test
        @DisplayName("DQ-01: 위기 사용자는 쿼터 초과 시에도 AI 코멘트를 받는다")
        void crisisUser_quotaExceeded_stillGetsAiComment() {
            // given
            stubUserFound();
            stubDiarySaved();
            setQuotaUsed(20);
            enableQuotaEnforcement();
            stubSafetyCheckCrisis(); // 위기 감지 → isSafe=false

            AiCommentResponse aiResponse = createAiCommentResponse();
            given(aiCommentService.generateComment(any(Diary.class), eq(testUser), eq(false)))
                    .willReturn(aiResponse);

            // when
            DiaryResponse response = diaryService.create(1L, request);

            // then - 예외 없이 AI 코멘트가 생성되어야 한다
            assertThat(response).isNotNull();
            verify(aiCommentService).generateComment(any(Diary.class), eq(testUser), eq(false));
        }

        @Test
        @DisplayName("DQ-02: SafetyCheck는 QuotaCheck보다 먼저 실행된다")
        void safetyCheckRunsBeforeQuotaCheck() {
            // given
            stubUserFound();
            stubDiarySaved();
            stubSafetyCheckSafe();
            enableQuotaEnforcement();

            AiCommentResponse aiResponse = createAiCommentResponse();
            given(aiCommentService.generateComment(any(Diary.class), eq(testUser), eq(true)))
                    .willReturn(aiResponse);

            // when
            diaryService.create(1L, request);

            // then - safetyCheck가 featureFlags(쿼터 검사)보다 먼저 호출되어야 한다
            // featureFlags.isQuotaEnforcementEnabled()는 쿼터 체크(L81)와 쿼터 증가(L110)에서 2번 호출됨
            InOrder order = inOrder(safetyCheckService, featureFlags);
            order.verify(safetyCheckService).check(any(Diary.class));
            order.verify(featureFlags, org.mockito.Mockito.atLeastOnce()).isQuotaEnforcementEnabled();
        }

        @Test
        @DisplayName("DQ-03: 위기 감지 시 사용자의 crisisFlag가 설정된다")
        void crisisDetected_setsCrisisFlag() {
            // given
            stubUserFound();
            stubDiarySaved();
            stubSafetyCheckCrisis();
            enableQuotaEnforcement();

            given(aiCommentService.generateComment(any(Diary.class), eq(testUser), eq(false)))
                    .willReturn(createAiCommentResponse());

            // when
            diaryService.create(1L, request);

            // then - setCrisisFlag가 호출되어 crisisFlagUntil이 설정된다
            assertThat(testUser.hasCrisisFlag()).isTrue();
        }
    }

    // --- 쿼터 제한 로직 ---

    @Nested
    @DisplayName("쿼터 제한 로직")
    class QuotaEnforcement {

        @Test
        @DisplayName("DQ-04: 무료 사용자가 쿼터 초과 시 QUOTA_EXCEEDED 예외를 던진다")
        void freeUser_quotaExceeded_throwsQuotaExceeded() {
            // given
            stubUserFound();
            stubDiarySaved();
            setQuotaUsed(20);
            enableQuotaEnforcement();
            stubSafetyCheckSafe();

            // when & then
            assertThatThrownBy(() -> diaryService.create(1L, request))
                    .isInstanceOf(CustomException.class)
                    .satisfies(ex -> assertThat(((CustomException) ex).getErrorCode())
                            .isEqualTo(ErrorCode.QUOTA_EXCEEDED));
        }

        @Test
        @DisplayName("DQ-05: 프리미엄 사용자는 쿼터 제한을 받지 않는다")
        void premiumUser_noQuotaLimit() {
            // given
            stubUserFound();
            stubDiarySaved();
            setQuotaUsed(100);
            enableQuotaEnforcement();
            stubSafetyCheckSafe();
            testUser.updateSubscription(SubscriptionStatus.ACTIVE, LocalDateTime.now().plusDays(30));

            given(aiCommentService.generateComment(any(Diary.class), eq(testUser), eq(true)))
                    .willReturn(createAiCommentResponse());

            // when
            DiaryResponse response = diaryService.create(1L, request);

            // then - 예외 없이 정상 처리
            assertThat(response).isNotNull();
        }

        @Test
        @DisplayName("DQ-06: AI 코멘트 생성 실패 시 쿼터가 증가하지 않는다")
        void aiFailure_quotaNotIncremented() {
            // given
            stubUserFound();
            stubDiarySaved();
            setQuotaUsed(5);
            enableQuotaEnforcement();
            stubSafetyCheckSafe();

            given(aiCommentService.generateComment(any(Diary.class), eq(testUser), eq(true)))
                    .willThrow(new RuntimeException("AI 서비스 오류"));

            int quotaBefore = testUser.getQuotaUsed();

            // when
            DiaryResponse response = diaryService.create(1L, request);

            // then - 쿼터가 증가하지 않아야 한다
            assertThat(testUser.getQuotaUsed()).isEqualTo(quotaBefore);
        }

        @Test
        @DisplayName("DQ-07: Feature Flag가 OFF이면 쿼터 검사를 건너뛴다")
        void featureFlagOff_skipsQuotaCheck() {
            // given
            stubUserFound();
            stubDiarySaved();
            setQuotaUsed(20);
            disableQuotaEnforcement();
            stubSafetyCheckSafe();

            given(aiCommentService.generateComment(any(Diary.class), eq(testUser), eq(true)))
                    .willReturn(createAiCommentResponse());

            // when
            DiaryResponse response = diaryService.create(1L, request);

            // then - 예외 없이 정상 처리
            assertThat(response).isNotNull();
        }
    }

    // --- Lazy Reset ---

    @Nested
    @DisplayName("Lazy Reset")
    class LazyReset {

        @Test
        @DisplayName("DQ-08: quotaResetDate가 과거이면 쿼터가 자동 리셋된다")
        void lazyReset_quotaResetDatePast_resetsQuota() {
            // given
            stubUserFound();
            stubDiarySaved();
            setQuotaUsed(15);
            ReflectionTestUtils.setField(testUser, "quotaResetDate", LocalDate.now().minusDays(1));
            enableQuotaEnforcement();
            stubSafetyCheckSafe();

            given(aiCommentService.generateComment(any(Diary.class), eq(testUser), eq(true)))
                    .willReturn(createAiCommentResponse());

            // when
            diaryService.create(1L, request);

            // then - 쿼터가 리셋되어 0 + 1(incrementQuotaUsed) = 1
            assertThat(testUser.getQuotaUsed()).isEqualTo(1);
        }
    }
}
