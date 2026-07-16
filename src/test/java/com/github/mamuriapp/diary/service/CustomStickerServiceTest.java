package com.github.mamuriapp.diary.service;

import com.github.mamuriapp.diary.entity.CustomSticker;
import com.github.mamuriapp.diary.repository.CustomStickerRepository;
import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.user.entity.SubscriptionStatus;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * CustomStickerService 단위 테스트.
 * 프리미엄 게이트, 개수 제한, 콘텐츠 타입 검증, 본인 소유 검증을 확인한다.
 */
@ExtendWith(MockitoExtension.class)
class CustomStickerServiceTest {

    @InjectMocks
    private CustomStickerService stickerService;

    @Mock
    private CustomStickerRepository stickerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StorageService storageService;

    private User premiumUser;
    private User freeUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(stickerService, "maxFileSize", 5_242_880L);

        premiumUser = User.builder().email("premium@test.com").password("pass").nickname("프리미엄").build();
        ReflectionTestUtils.setField(premiumUser, "id", 1L);
        ReflectionTestUtils.setField(premiumUser, "subscriptionStatus", SubscriptionStatus.ACTIVE);

        freeUser = User.builder().email("free@test.com").password("pass").nickname("무료").build();
        ReflectionTestUtils.setField(freeUser, "id", 2L);
        ReflectionTestUtils.setField(freeUser, "subscriptionStatus", SubscriptionStatus.FREE);
    }

    private MultipartFile pngFile() {
        return new MockMultipartFile("file", "sticker.png", "image/png", new byte[]{1, 2, 3, 4});
    }

    @Nested
    @DisplayName("업로드(생성)")
    class Upload {

        @Test
        @DisplayName("프리미엄 유저는 업로드에 성공한다")
        void premiumUserCanUpload() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(premiumUser));
            when(stickerRepository.countByUserId(1L)).thenReturn(0);
            when(storageService.store(any(), anyString())).thenReturn("custom-stickers/1/uuid.png");
            when(storageService.getPublicUrl(anyString())).thenReturn("/uploads/custom-stickers/1/uuid.png");
            when(stickerRepository.save(any(CustomSticker.class))).thenAnswer(inv -> inv.getArgument(0));

            var response = stickerService.upload(1L, pngFile(), 200, 200, null);

            assertThat(response.getUrl()).contains("custom-stickers/1");
            verify(stickerRepository).save(any(CustomSticker.class));
            verify(storageService).store(any(), eq("custom-stickers/1"));
        }

        @Test
        @DisplayName("프리미엄이 아닌 유저는 업로드가 거부된다(PREMIUM_REQUIRED)")
        void freeUserCannotUpload() {
            when(userRepository.findById(2L)).thenReturn(Optional.of(freeUser));

            assertThatThrownBy(() -> stickerService.upload(2L, pngFile(), 200, 200, null))
                    .isInstanceOf(CustomException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PREMIUM_REQUIRED);

            verify(storageService, never()).store(any(), anyString());
            verify(stickerRepository, never()).save(any());
        }

        @Test
        @DisplayName("개수 제한(50개)에 도달하면 거부된다(QUOTA_EXCEEDED)")
        void rejectWhenLimitReached() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(premiumUser));
            when(stickerRepository.countByUserId(1L))
                    .thenReturn(CustomStickerService.MAX_STICKERS_PER_USER);

            assertThatThrownBy(() -> stickerService.upload(1L, pngFile(), 200, 200, null))
                    .isInstanceOf(CustomException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.QUOTA_EXCEEDED);

            verify(storageService, never()).store(any(), anyString());
        }

        @Test
        @DisplayName("허용되지 않은 콘텐츠 타입은 거부된다(INVALID_INPUT)")
        void rejectInvalidContentType() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(premiumUser));
            MultipartFile pdf = new MockMultipartFile("file", "x.pdf", "application/pdf", new byte[]{1});

            assertThatThrownBy(() -> stickerService.upload(1L, pdf, null, null, null))
                    .isInstanceOf(CustomException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
        }
    }

    @Nested
    @DisplayName("삭제")
    class Delete {

        @Test
        @DisplayName("본인 소유 스티커는 파일과 함께 삭제된다")
        void deleteOwnSticker() {
            CustomSticker sticker = CustomSticker.builder()
                    .user(premiumUser)
                    .storageKey("custom-stickers/1/uuid.png")
                    .fileSize(4)
                    .build();
            ReflectionTestUtils.setField(sticker, "id", 10L);
            when(stickerRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(sticker));

            stickerService.delete(10L, 1L);

            verify(storageService).delete("custom-stickers/1/uuid.png");
            verify(stickerRepository).delete(sticker);
        }

        @Test
        @DisplayName("본인 소유가 아니면 삭제가 거부된다(STICKER_NOT_FOUND)")
        void cannotDeleteOthersSticker() {
            when(stickerRepository.findByIdAndUserId(10L, 2L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> stickerService.delete(10L, 2L))
                    .isInstanceOf(CustomException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.STICKER_NOT_FOUND);

            verify(storageService, never()).delete(anyString());
            verify(stickerRepository, never()).delete(any());
        }
    }
}
