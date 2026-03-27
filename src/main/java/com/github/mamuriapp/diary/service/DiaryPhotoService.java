package com.github.mamuriapp.diary.service;

import com.github.mamuriapp.diary.dto.DiaryPhotoResponse;
import com.github.mamuriapp.diary.entity.Diary;
import com.github.mamuriapp.diary.entity.DiaryPhoto;
import com.github.mamuriapp.diary.repository.DiaryPhotoRepository;
import com.github.mamuriapp.diary.repository.DiaryRepository;
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

/**
 * 일기 사진 서비스.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DiaryPhotoService {

    private static final int MAX_PHOTOS_PER_DIARY = 5;
    private static final long MAX_STORAGE_PER_USER = 100L * 1024 * 1024; // 100MB

    private final DiaryPhotoRepository photoRepository;
    private final DiaryRepository diaryRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    @Value("${upload.max-file-size:5242880}")
    private long maxFileSize;

    /**
     * 일기에 사진을 업로드한다.
     */
    @Transactional
    public DiaryPhotoResponse upload(Long diaryId, Long userId, MultipartFile file) {
        Diary diary = diaryRepository.findByIdAndUserId(diaryId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.DIARY_NOT_FOUND));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 파일 크기 검증
        if (file.getSize() > maxFileSize) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }

        // 일기당 사진 개수 제한
        int currentCount = photoRepository.countByDiaryId(diaryId);
        if (currentCount >= MAX_PHOTOS_PER_DIARY) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }

        // 사용자 전체 용량 제한
        long currentUsage = photoRepository.sumFileSizeByUserId(userId);
        if (currentUsage + file.getSize() > MAX_STORAGE_PER_USER) {
            throw new CustomException(ErrorCode.QUOTA_EXCEEDED);
        }

        String storageKey = storageService.store(file, "diary-photos/" + userId);

        DiaryPhoto photo = DiaryPhoto.builder()
                .diary(diary)
                .user(user)
                .storageKey(storageKey)
                .originalFilename(file.getOriginalFilename())
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .displayOrder(currentCount)
                .build();
        photoRepository.save(photo);

        return DiaryPhotoResponse.from(photo, storageService.getPublicUrl(storageKey));
    }

    /**
     * 일기의 사진 목록을 조회한다.
     */
    @Transactional(readOnly = true)
    public List<DiaryPhotoResponse> getPhotos(Long diaryId) {
        return photoRepository.findByDiaryIdOrderByDisplayOrderAsc(diaryId).stream()
                .map(p -> DiaryPhotoResponse.from(p, storageService.getPublicUrl(p.getStorageKey())))
                .toList();
    }

    /**
     * 사진을 삭제한다.
     */
    @Transactional
    public void delete(Long photoId, Long userId) {
        DiaryPhoto photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new CustomException(ErrorCode.DIARY_NOT_FOUND));

        if (!photo.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.DIARY_NOT_FOUND);
        }

        storageService.delete(photo.getStorageKey());
        photoRepository.delete(photo);
    }
}
