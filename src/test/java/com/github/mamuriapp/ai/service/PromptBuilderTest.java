package com.github.mamuriapp.ai.service;

import com.github.mamuriapp.diary.entity.Diary;
import com.github.mamuriapp.diary.repository.DiaryRepository;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.entity.UserSettings;
import com.github.mamuriapp.user.repository.UserSettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * PromptBuilder 단위 테스트.
 * 톤 매핑, 말투 스타일, 템플릿 치환을 검증한다.
 */
@ExtendWith(MockitoExtension.class)
class PromptBuilderTest {

    @InjectMocks
    private PromptBuilder promptBuilder;

    @Mock
    private UserSettingsRepository userSettingsRepository;

    @Mock
    private DiaryRepository diaryRepository;

    private User testUser;
    private Diary testDiary;

    private static final String V4_TEMPLATE = """
            너는 '{{aiName}}'이라는 이름의 AI 친구야.
            [너의 성격]
            - {{toneInstruction}}
            [규칙]
            - {{speechStyleInstruction}}
            - 레벨: Lv.{{level}} — {{levelDescription}}
            {{recentDiaries}}
            [오늘의 일기]
            {{content}}""";

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("test@example.com")
                .password("password")
                .nickname("테스트")
                .build();
        ReflectionTestUtils.setField(testUser, "id", 1L);

        testDiary = Diary.builder()
                .user(testUser)
                .title("테스트 일기")
                .content("오늘 하루도 수고했다.")
                .diaryDate(LocalDate.now())
                .build();
        ReflectionTestUtils.setField(testDiary, "id", 1L);
    }

    @Nested
    @DisplayName("톤 매핑 테스트")
    class ToneMapping {

        @Test
        @DisplayName("realistic 톤이 올바르게 프롬프트에 반영된다")
        void realisticTone_mappedCorrectly() {
            // given
            UserSettings settings = UserSettings.builder()
                    .user(testUser)
                    .aiTone("realistic")
                    .aiEnabled(true)
                    .aiSpeechStyle("formal")
                    .build();
            when(userSettingsRepository.findByUserId(1L)).thenReturn(Optional.of(settings));
            when(diaryRepository.findTop5ByUserIdAndIdNotOrderByCreatedAtDesc(anyLong(), anyLong()))
                    .thenReturn(List.of());

            // when
            String result = promptBuilder.build(V4_TEMPLATE, testUser, testDiary, 3000);

            // then
            assertThat(result).contains("솔직하고 현실적이며 담백한 말투");
        }

        @Test
        @DisplayName("warm 톤이 올바르게 프롬프트에 반영된다")
        void warmTone_mappedCorrectly() {
            // given
            UserSettings settings = UserSettings.builder()
                    .user(testUser)
                    .aiTone("warm")
                    .aiEnabled(true)
                    .aiSpeechStyle("formal")
                    .build();
            when(userSettingsRepository.findByUserId(1L)).thenReturn(Optional.of(settings));
            when(diaryRepository.findTop5ByUserIdAndIdNotOrderByCreatedAtDesc(anyLong(), anyLong()))
                    .thenReturn(List.of());

            // when
            String result = promptBuilder.build(V4_TEMPLATE, testUser, testDiary, 3000);

            // then
            assertThat(result).contains("따뜻하고 공감하며 위로하는 말투");
        }
    }

    @Nested
    @DisplayName("말투 스타일 테스트")
    class SpeechStyleMapping {

        @Test
        @DisplayName("casual 말투가 올바르게 치환된다")
        void casualSpeechStyle_replacedCorrectly() {
            // given
            UserSettings settings = UserSettings.builder()
                    .user(testUser)
                    .aiTone("warm")
                    .aiEnabled(true)
                    .aiSpeechStyle("casual")
                    .build();
            when(userSettingsRepository.findByUserId(1L)).thenReturn(Optional.of(settings));
            when(diaryRepository.findTop5ByUserIdAndIdNotOrderByCreatedAtDesc(anyLong(), anyLong()))
                    .thenReturn(List.of());

            // when
            String result = promptBuilder.build(V4_TEMPLATE, testUser, testDiary, 3000);

            // then
            assertThat(result).contains("편안한 반말로 친구처럼 이야기하세요");
            assertThat(result).doesNotContain("{{speechStyleInstruction}}");
        }

        @Test
        @DisplayName("formal 말투가 올바르게 치환된다")
        void formalSpeechStyle_replacedCorrectly() {
            // given
            UserSettings settings = UserSettings.builder()
                    .user(testUser)
                    .aiTone("warm")
                    .aiEnabled(true)
                    .aiSpeechStyle("formal")
                    .build();
            when(userSettingsRepository.findByUserId(1L)).thenReturn(Optional.of(settings));
            when(diaryRepository.findTop5ByUserIdAndIdNotOrderByCreatedAtDesc(anyLong(), anyLong()))
                    .thenReturn(List.of());

            // when
            String result = promptBuilder.build(V4_TEMPLATE, testUser, testDiary, 3000);

            // then
            assertThat(result).contains("반드시 존댓말(높임말)을 사용하세요");
        }

        @Test
        @DisplayName("settings가 null이면 formal 기본값이 사용된다")
        void nullSettings_defaultsToFormal() {
            // given
            when(userSettingsRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(diaryRepository.findTop5ByUserIdAndIdNotOrderByCreatedAtDesc(anyLong(), anyLong()))
                    .thenReturn(List.of());

            // when
            String result = promptBuilder.build(V4_TEMPLATE, testUser, testDiary, 3000);

            // then
            assertThat(result).contains("반드시 존댓말(높임말)을 사용하세요");
        }
    }

    @Nested
    @DisplayName("AI 비활성화 테스트")
    class AiDisabled {

        @Test
        @DisplayName("aiEnabled=false이면 null을 반환한다")
        void aiDisabled_returnsNull() {
            // given
            UserSettings settings = UserSettings.builder()
                    .user(testUser)
                    .aiTone("warm")
                    .aiEnabled(false)
                    .aiSpeechStyle("formal")
                    .build();
            when(userSettingsRepository.findByUserId(1L)).thenReturn(Optional.of(settings));

            // when
            String result = promptBuilder.build(V4_TEMPLATE, testUser, testDiary, 3000);

            // then
            assertThat(result).isNull();
        }
    }
}
