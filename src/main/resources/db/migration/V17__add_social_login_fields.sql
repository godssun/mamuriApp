-- 소셜 로그인 지원을 위한 필드 추가
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'EMAIL';
ALTER TABLE users ADD COLUMN provider_uid VARCHAR(255);
ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(500);

-- password nullable 변경 (소셜 사용자는 비밀번호 없음)
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- 소셜 프로바이더 + UID 조합 인덱스
CREATE INDEX idx_users_provider ON users(auth_provider, provider_uid);
