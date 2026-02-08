-- 일기 날짜 컬럼 추가
-- 기존 데이터는 created_at 날짜로 설정
ALTER TABLE diaries ADD COLUMN diary_date DATE;

-- 기존 데이터 마이그레이션: created_at의 날짜 부분을 diary_date로 설정
UPDATE diaries SET diary_date = DATE(created_at) WHERE diary_date IS NULL;

-- NOT NULL 제약조건 추가
ALTER TABLE diaries ALTER COLUMN diary_date SET NOT NULL;

-- 기존 created_at 인덱스 삭제 (diary_date로 대체)
DROP INDEX IF EXISTS idx_diaries_created_at;

-- 새 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_diary_user_date ON diaries(user_id, diary_date DESC);
CREATE INDEX IF NOT EXISTS idx_diary_date ON diaries(diary_date);
