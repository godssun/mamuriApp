package com.github.mamuriapp.diary.service;

import com.github.mamuriapp.diary.dto.CustomStickerResponse;
import com.github.mamuriapp.diary.entity.CustomSticker;
import com.github.mamuriapp.diary.repository.CustomStickerRepository;
import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;

/**
 * 커스텀 스티커 서비스.
 *
 * 생성(업로드)은 프리미엄 구독자(ACTIVE/TRIALING)만 가능하며,
 * 조회/삭제는 구독 해지 후에도 허용한다(이미 만든 스티커는 계속 사용 가능).
 * 투명도 보존을 위해 이미지는 재인코딩 없이 원본 바이트 그대로 저장한다(PNG 우선 허용).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomStickerService {

    /** 유저당 커스텀 스티커 최대 개수. */
    static final int MAX_STICKERS_PER_USER = 50;

    /** 투명도 보존을 위해 PNG를 우선 허용하고, 폴백(테두리) 모드용으로 JPEG/WebP도 허용한다. */
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/png", "image/jpeg", "image/webp"
    );

    private final CustomStickerRepository stickerRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    @Value("${upload.max-file-size:5242880}")
    private long maxFileSize;

    /**
     * 커스텀 스티커를 업로드한다. 프리미엄 구독자만 생성 가능.
     */
    @Transactional
    public CustomStickerResponse upload(Long userId, MultipartFile file,
                                        Integer width, Integer height, String borderStyle) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 서버 측 프리미엄 체크 (생성만) — 구독 해지 후에도 조회/삭제는 허용
        if (!user.isPremium()) {
            throw new CustomException(ErrorCode.PREMIUM_REQUIRED);
        }

        if (file == null || file.isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }
        if (file.getSize() > maxFileSize) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }

        // 유저당 개수 제한
        int currentCount = stickerRepository.countByUserId(userId);
        if (currentCount >= MAX_STICKERS_PER_USER) {
            throw new CustomException(ErrorCode.QUOTA_EXCEEDED);
        }

        // StorageService는 원본 확장자를 보존한 채 바이트 그대로 복사하므로 PNG 투명도가 유지된다.
        String storageKey = storageService.store(file, "custom-stickers/" + userId);

        CustomSticker sticker = CustomSticker.builder()
                .user(user)
                .storageKey(storageKey)
                .originalFilename(file.getOriginalFilename())
                .contentType(contentType)
                .fileSize(file.getSize())
                .width(width)
                .height(height)
                .borderStyle(borderStyle)
                .build();
        stickerRepository.save(sticker);

        return CustomStickerResponse.from(sticker, storageService.getPublicUrl(storageKey));
    }

    /**
     * 내 커스텀 스티커 목록을 조회한다. (구독 상태 무관)
     */
    @Transactional(readOnly = true)
    public List<CustomStickerResponse> getMyStickers(Long userId) {
        return stickerRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(s -> CustomStickerResponse.from(s, storageService.getPublicUrl(s.getStorageKey())))
                .toList();
    }

    /**
     * 커스텀 스티커를 삭제한다. 본인 소유만 삭제 가능하며 파일도 함께 제거한다. (구독 상태 무관)
     */
    @Transactional
    public void delete(Long stickerId, Long userId) {
        CustomSticker sticker = stickerRepository.findByIdAndUserId(stickerId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.STICKER_NOT_FOUND));

        storageService.delete(sticker.getStorageKey());
        stickerRepository.delete(sticker);
    }
}
