package com.github.mamuriapp.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 파일 업로드 설정.
 */
@Component
@ConfigurationProperties(prefix = "upload")
@Getter
@Setter
public class UploadProperties {
    private String dir = "uploads";
    private long maxFileSize = 5242880; // 5MB
}
