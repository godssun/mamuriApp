package com.github.mamuriapp.diary.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * 파일 저장소 인터페이스.
 */
public interface StorageService {

    /**
     * 파일을 저장하고 storage key를 반환한다.
     */
    String store(MultipartFile file, String directory);

    /**
     * 저장된 파일을 삭제한다.
     */
    void delete(String storageKey);

    /**
     * 공개 접근 URL을 반환한다.
     */
    String getPublicUrl(String storageKey);
}
