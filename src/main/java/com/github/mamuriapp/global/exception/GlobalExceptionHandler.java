package com.github.mamuriapp.global.exception;

import com.github.mamuriapp.global.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.stream.Collectors;

/**
 * 전역 예외 처리 핸들러.
 * 모든 컨트롤러에서 발생하는 예외를 일관된 {@link ApiResponse} 형태로 변환한다.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @Value("${spring.profiles.active:prod}")
    private String activeProfile;

    /**
     * {@link CustomException} 처리.
     *
     * @param e 커스텀 예외
     * @return 에러 코드에 대응하는 HTTP 응답
     */
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiResponse<Void>> handleCustomException(CustomException e) {
        log.warn("CustomException: {}", e.getMessage());
        return ResponseEntity
                .status(e.getErrorCode().getStatus())
                .body(ApiResponse.fail(e.getMessage()));
    }

    /**
     * 요청 바디 유효성 검증 실패 처리.
     *
     * @param e 유효성 검증 예외
     * @return 필드별 에러 메시지를 포함한 HTTP 400 응답
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(
            MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(ApiResponse.fail(message));
    }

    /**
     * 예상하지 못한 예외 처리.
     *
     * @param e 예외
     * @return HTTP 500 응답
     */
    /**
     * 타입 변환 실패 처리 (e.g. PathVariable에 문자열이 들어온 경우).
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        log.warn("TypeMismatch: {}", e.getMessage());
        return ResponseEntity.badRequest()
                .body(ApiResponse.fail(ErrorCode.INVALID_INPUT.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Unhandled exception", e);
        String message = "dev".equals(activeProfile)
                ? e.getClass().getSimpleName() + ": " + e.getMessage()
                : ErrorCode.INTERNAL_ERROR.getMessage();
        return ResponseEntity
                .internalServerError()
                .body(ApiResponse.fail(message));
    }
}
