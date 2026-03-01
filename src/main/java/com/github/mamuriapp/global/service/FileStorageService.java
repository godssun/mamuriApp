package com.github.mamuriapp.global.service;

import com.github.mamuriapp.global.config.UploadProperties;
import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

/**
 * 파일 저장 서비스.
 * 업로드된 파일을 로컬 디스크에 저장하고 URL 경로를 반환한다.
 */
@Slf4j
@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private final Path uploadDir;
    private final long maxFileSize;

    public FileStorageService(UploadProperties uploadProperties) {
        this.uploadDir = Paths.get(uploadProperties.getDir()).toAbsolutePath().normalize();
        this.maxFileSize = uploadProperties.getMaxFileSize();

        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            log.error("업로드 디렉터리 생성 실패: {}", this.uploadDir, e);
            throw new RuntimeException("업로드 디렉터리를 생성할 수 없습니다.", e);
        }
    }

    /**
     * 이미지 파일을 저장하고 상대 경로를 반환한다.
     *
     * @param file 업로드된 파일
     * @param subDir 하위 디렉터리 (예: "avatars")
     * @return 저장된 파일의 상대 경로 (예: "/uploads/avatars/uuid.jpg")
     */
    public String storeImage(MultipartFile file, String subDir) {
        validateFile(file);

        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String storedFilename = UUID.randomUUID() + extension;

        Path targetDir = uploadDir.resolve(subDir);
        try {
            Files.createDirectories(targetDir);
        } catch (IOException e) {
            log.error("하위 디렉터리 생성 실패: {}", targetDir, e);
            throw new CustomException(ErrorCode.INTERNAL_ERROR);
        }

        Path targetPath = targetDir.resolve(storedFilename);
        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("파일 저장 실패: {}", targetPath, e);
            throw new CustomException(ErrorCode.INTERNAL_ERROR);
        }

        return "/uploads/" + subDir + "/" + storedFilename;
    }

    /**
     * 기존 파일을 삭제한다.
     *
     * @param filePath 삭제할 파일의 상대 경로 (예: "/uploads/avatars/uuid.jpg")
     */
    public void deleteFile(String filePath) {
        if (filePath == null || filePath.isBlank()) return;

        // "/uploads/" 프리픽스 제거
        String relativePath = filePath.startsWith("/uploads/")
                ? filePath.substring("/uploads/".length())
                : filePath;

        Path targetPath = uploadDir.resolve(relativePath).normalize();

        // path traversal 방지
        if (!targetPath.startsWith(uploadDir)) {
            log.warn("파일 삭제 시도 차단 (path traversal): {}", filePath);
            return;
        }

        try {
            Files.deleteIfExists(targetPath);
        } catch (IOException e) {
            log.warn("파일 삭제 실패: {}", targetPath, e);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }

        if (file.getSize() > maxFileSize) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg";
        }
        return filename.substring(filename.lastIndexOf(".")).toLowerCase();
    }
}
