package com.github.mamuriapp.diary.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
@ConditionalOnProperty(name = "storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    @Override
    public String store(MultipartFile file, String directory) {
        try {
            Path dirPath = Paths.get(uploadDir, directory);
            Files.createDirectories(dirPath);

            String extension = getExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + extension;
            Path filePath = dirPath.resolve(filename);

            file.transferTo(filePath.toFile());
            log.debug("파일 저장 완료: {}", filePath);

            return directory + "/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("파일 저장에 실패했습니다.", e);
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            Path filePath = Paths.get(uploadDir, storageKey);
            Files.deleteIfExists(filePath);
            log.debug("파일 삭제 완료: {}", filePath);
        } catch (IOException e) {
            log.warn("파일 삭제 실패: {}", storageKey, e);
        }
    }

    @Override
    public String getPublicUrl(String storageKey) {
        return "/uploads/" + storageKey;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }
}
