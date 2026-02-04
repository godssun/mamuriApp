package com.github.mamuriapp.global.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 모든 API 응답을 감싸는 공통 응답 래퍼.
 *
 * @param <T> 응답 데이터의 타입
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final T data;
    private final String message;

    /**
     * 성공 응답을 생성한다 (데이터 포함).
     *
     * @param data 응답 데이터
     * @param <T>  데이터 타입
     * @return 성공 ApiResponse
     */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null);
    }

    /**
     * 성공 응답을 생성한다 (데이터 없음).
     *
     * @return 성공 ApiResponse
     */
    public static <Void> ApiResponse<Void> success() {
        return new ApiResponse<>(true, null, null);
    }

    /**
     * 실패 응답을 생성한다.
     *
     * @param message 에러 메시지
     * @param <T>     데이터 타입
     * @return 실패 ApiResponse
     */
    public static <T> ApiResponse<T> fail(String message) {
        return new ApiResponse<>(false, null, message);
    }
}
