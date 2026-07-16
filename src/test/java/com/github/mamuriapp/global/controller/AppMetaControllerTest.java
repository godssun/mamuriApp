package com.github.mamuriapp.global.controller;

import com.github.mamuriapp.global.dto.ApiResponse;
import com.github.mamuriapp.global.dto.VersionCheckResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class AppMetaControllerTest {

    private AppMetaController controller;

    @BeforeEach
    void setUp() {
        controller = new AppMetaController();
        ReflectionTestUtils.setField(controller, "minimumIos", "2.0.0");
        ReflectionTestUtils.setField(controller, "minimumAndroid", "2.1.0");
        ReflectionTestUtils.setField(controller, "storeUrlIos", "https://apps.apple.com/app/id6760908812");
        ReflectionTestUtils.setField(controller, "storeUrlAndroid", "https://play.google.com/store/apps/details?id=com.junsapps.mamuri");
        ReflectionTestUtils.setField(controller, "updateMessage", "");
    }

    private VersionCheckResponse check(String platform, String version) {
        ApiResponse<VersionCheckResponse> res = controller.checkVersion(platform, version);
        return res.getData();
    }

    @Test
    @DisplayName("최소 버전보다 낮으면 강제 업데이트")
    void forceUpdateWhenBelowMinimum() {
        assertThat(check("ios", "1.9.9").isForceUpdate()).isTrue();
        assertThat(check("android", "2.0.5").isForceUpdate()).isTrue();
    }

    @Test
    @DisplayName("최소 버전 이상이면 통과")
    void passWhenAtOrAboveMinimum() {
        assertThat(check("ios", "2.0.0").isForceUpdate()).isFalse();
        assertThat(check("ios", "2.10.1").isForceUpdate()).isFalse();
        assertThat(check("android", "3.0.0").isForceUpdate()).isFalse();
    }

    @Test
    @DisplayName("자릿수가 달라도 숫자 기준으로 비교한다 (2.10 > 2.9)")
    void comparesNumericallyNotLexically() {
        ReflectionTestUtils.setField(controller, "minimumIos", "2.9.0");
        assertThat(check("ios", "2.10.0").isForceUpdate()).isFalse();
    }

    @Test
    @DisplayName("파싱 불가능한 버전은 강제 업데이트하지 않는다 (fail-open)")
    void failOpenOnUnparsableVersion() {
        assertThat(check("ios", "beta").isForceUpdate()).isFalse();
        assertThat(check("ios", "").isForceUpdate()).isFalse();
    }

    @Test
    @DisplayName("플랫폼별 최소 버전과 스토어 URL을 반환한다")
    void returnsPlatformSpecificFields() {
        VersionCheckResponse ios = check("ios", "2.0.0");
        assertThat(ios.getMinimumSupportedVersion()).isEqualTo("2.0.0");
        assertThat(ios.getStoreUrl()).contains("apps.apple.com");

        VersionCheckResponse android = check("android", "2.1.0");
        assertThat(android.getMinimumSupportedVersion()).isEqualTo("2.1.0");
        assertThat(android.getStoreUrl()).contains("play.google.com");
    }
}
