-- 사용자별 일기 수 비정규화 필드 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS diary_count BIGINT NOT NULL DEFAULT 0;

-- 기존 데이터 동기화
UPDATE users u SET diary_count = (
    SELECT COUNT(*) FROM diaries d WHERE d.user_id = u.id
);
