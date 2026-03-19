-- V19: Refresh token 보안 강화
-- 기존 평문 refresh token을 null 처리하여 무효화한다.
-- 이후 애플리케이션은 SHA-256 해시된 토큰만 저장한다.
-- 영향: 모든 기존 사용자가 재로그인해야 함.

UPDATE users SET refresh_token = NULL WHERE refresh_token IS NOT NULL;
