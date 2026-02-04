package com.github.mamuriapp.global.exception;

import lombok.Getter;

/**
 * 애플리케이션 커스텀 예외.
 * {@link ErrorCode}를 기반으로 일관된 에러 응답을 생성한다.
 */
@Getter
public class CustomException extends RuntimeException {

    private final ErrorCode errorCode;

    /**
     * 지정된 에러 코드로 예외를 생성한다.
     *
     * @param errorCode 에러 코드
     */
    public CustomException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
