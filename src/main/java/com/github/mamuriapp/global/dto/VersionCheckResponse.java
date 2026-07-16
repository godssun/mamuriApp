package com.github.mamuriapp.global.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * 앱 강제 업데이트 버전 체크 응답.
 * 모바일 클라이언트의 VersionCheckResponse 타입과 필드가 일치해야 한다.
 */
@Getter
@Builder
public class VersionCheckResponse {

    private final String minimumSupportedVersion;
    private final boolean forceUpdate;
    private final String storeUrl;
    private final String message;
}
