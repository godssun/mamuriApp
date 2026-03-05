package com.github.mamuriapp.ai.service;

import com.github.mamuriapp.ai.repository.SafetyEventRepository;
import com.github.mamuriapp.diary.entity.Diary;
import com.github.mamuriapp.user.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * SafetyCheckService 위기 키워드 감지 단위 테스트.
 */
@ExtendWith(MockitoExtension.class)
class SafetyCheckServiceTest {

    @InjectMocks
    private SafetyCheckService safetyCheckService;

    @Mock
    private SafetyEventRepository safetyEventRepository;

    private final User testUser = User.builder()
            .email("test@example.com")
            .password("password")
            .nickname("테스트")
            .build();

    private Diary createDiary(String content) {
        return Diary.builder()
                .user(testUser)
                .title("테스트 일기")
                .content(content)
                .diaryDate(LocalDate.now())
                .build();
    }

    // --- 위기 키워드 감지 ---

    @Nested
    @DisplayName("위기 키워드 감지")
    class CrisisKeywordDetection {

        @ParameterizedTest(name = "키워드 \"{0}\" 포함 시 false를 반환한다")
        @ValueSource(strings = {
                "자살", "자해", "죽고 싶", "죽고싶", "죽을 거",
                "죽을거", "목숨을 끊", "목숨을끊", "끝내고 싶",
                "끝내고싶", "살고 싶지 않", "살고싶지않",
                "세상을 떠나", "세상을떠나",
                "사라지고 싶", "사라지고싶", "모든 게 끝났으면", "모든게 끝났으면",
                "없어지고 싶", "없어지고싶", "더 이상 못 버티", "더이상 못버티",
                "삶이 의미 없", "삶이 의미없", "다 포기하고 싶", "다 포기하고싶"
        })
        @DisplayName("위기 키워드 감지")
        void crisisKeyword_returnsFalse(String keyword) {
            // given
            Diary diary = createDiary("오늘은 정말 힘들어서 " + keyword + "다는 생각이 들어");

            // when
            boolean result = safetyCheckService.check(diary);

            // then
            assertThat(result).isFalse();
        }
    }

    // --- 안전한 텍스트 ---

    @Nested
    @DisplayName("안전한 텍스트")
    class SafeText {

        @Test
        @DisplayName("위기 키워드가 없는 안전한 텍스트는 true를 반환한다")
        void safeText_returnsTrue() {
            // given
            Diary diary = createDiary("오늘은 날씨가 좋아서 산책을 했다. 기분이 좋았다.");

            // when
            boolean result = safetyCheckService.check(diary);

            // then
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("null 콘텐츠는 true를 반환한다")
        void nullContent_returnsTrue() {
            // given
            Diary diary = createDiary(null);

            // when
            boolean result = safetyCheckService.check(diary);

            // then
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("빈 문자열 콘텐츠는 true를 반환한다")
        void blankContent_returnsTrue() {
            // given
            Diary diary = createDiary("   ");

            // when
            boolean result = safetyCheckService.check(diary);

            // then
            assertThat(result).isTrue();
        }
    }

    // --- 공백 정규화 ---

    @Nested
    @DisplayName("공백 정규화")
    class SpaceNormalization {

        @Test
        @DisplayName("키워드에 공백이 삽입되어도 정규화하여 감지한다")
        void keywordWithSpaces_normalizedAndDetected() {
            // given - "죽 고 싶" → 정규화 → "죽고싶"
            Diary diary = createDiary("오늘 죽 고 싶 다는 생각이 들었어");

            // when
            boolean result = safetyCheckService.check(diary);

            // then
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("키워드 사이에 다수 공백이 있어도 감지한다")
        void keywordWithMultipleSpaces_detected() {
            // given - "사 라 지 고  싶" → 정규화 → "사라지고싶"
            Diary diary = createDiary("나는 사 라 지 고  싶 어");

            // when
            boolean result = safetyCheckService.check(diary);

            // then
            assertThat(result).isFalse();
        }
    }
}
