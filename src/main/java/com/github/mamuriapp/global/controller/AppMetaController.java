package com.github.mamuriapp.global.controller;

import com.github.mamuriapp.global.dto.ApiResponse;
import com.github.mamuriapp.global.dto.VersionCheckResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 앱 메타 API (인증 불필요).
 *
 * 클라이언트 부팅 시 강제 업데이트 여부를 판단한다.
 * 클라이언트는 이 API 실패 시 fail-open(통과)이므로,
 * 여기서는 잘못된 입력에도 절대 강제 업데이트를 반환하지 않는 방향으로 보수적으로 동작한다.
 */
@Slf4j
@RestController
@RequestMapping("/api/app")
public class AppMetaController {

    @Value("${app.version.minimum-ios:1.0.0}")
    private String minimumIos;

    @Value("${app.version.minimum-android:1.0.0}")
    private String minimumAndroid;

    @Value("${app.version.store-url-ios:https://apps.apple.com/app/id6760908812}")
    private String storeUrlIos;

    @Value("${app.version.store-url-android:https://play.google.com/store/apps/details?id=com.junsapps.mamuri}")
    private String storeUrlAndroid;

    @Value("${app.version.update-message:}")
    private String updateMessage;

    @GetMapping("/version-check")
    public ApiResponse<VersionCheckResponse> checkVersion(
            @RequestParam String platform,
            @RequestParam String currentVersion
    ) {
        boolean isIos = "ios".equalsIgnoreCase(platform);
        String minimum = isIos ? minimumIos : minimumAndroid;
        String storeUrl = isIos ? storeUrlIos : storeUrlAndroid;

        boolean forceUpdate = isOlderThan(currentVersion, minimum);

        return ApiResponse.success(VersionCheckResponse.builder()
                .minimumSupportedVersion(minimum)
                .forceUpdate(forceUpdate)
                .storeUrl(storeUrl)
                .message(updateMessage)
                .build());
    }

    /**
     * current가 minimum보다 낮으면 true. 파싱 불가능한 버전은 강제 업데이트하지 않는다.
     */
    private boolean isOlderThan(String current, String minimum) {
        try {
            String[] cur = current.trim().split("\\.");
            String[] min = minimum.trim().split("\\.");
            int len = Math.max(cur.length, min.length);
            for (int i = 0; i < len; i++) {
                int c = i < cur.length ? Integer.parseInt(cur[i].replaceAll("[^0-9].*$", "")) : 0;
                int m = i < min.length ? Integer.parseInt(min[i].replaceAll("[^0-9].*$", "")) : 0;
                if (c != m) {
                    return c < m;
                }
            }
            return false;
        } catch (NumberFormatException e) {
            log.warn("version-check: unparsable version current={} minimum={}", current, minimum);
            return false;
        }
    }
}
