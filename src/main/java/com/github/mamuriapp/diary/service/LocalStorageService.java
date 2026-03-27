package com.github.mamuriapp.diary.service;

import com.github.mamuriapp.global.config.UploadProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * 로컬 파일 시스템 기반 저장소 구현.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    private final UploadProperties uploadProperties;

    @Override
    public String store(MultipartFile file, String directory) {
        try {
            Path dirPath = Paths.get(uploadProperties.getDir(), directory).toAbsolutePath();
            Files.createDirectories(dirPath);

            String extension = getExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + extension;
            Path filePath = dirPath.resolve(filename);

            // transferTo()가 임시 파일 정리 후 실패할 수 있으므로 InputStream 방식 사용
            Files.copy(file.getInputStream(), filePath);
            log.info("파일 저장 완료: {} ({}bytes)", filePath, file.getSize());

            return directory + "/" + filename;
        } catch (IOException e) {
            log.error("파일 저장 실패: dir={}, originalName={}", directory, file.getOriginalFilename(), e);
            throw new RuntimeException("파일 저장에 실패했습니다.", e);
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            Path filePath = Paths.get(uploadProperties.getDir(), storageKey);
            Files.deleteIfExists(filePath);
            log.debug("파일 삭제 완료: {}", filePath);
        } catch (IOException e) {
            log.warn("파일 삭제 실패: {}", storageKey, e);
        }
    }

    @Override
    public String getPublicUrl(String storageKey) {
        String baseUrl = uploadProperties.getBaseUrl();
        if (baseUrl != null && !baseUrl.isEmpty()) {
            return baseUrl + "/uploads/" + storageKey;
        }
        return "/uploads/" + storageKey;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }
}
