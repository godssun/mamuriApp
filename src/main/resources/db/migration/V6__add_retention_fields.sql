-- ai_comments에 후속 질문 컬럼
ALTER TABLE ai_comments ADD COLUMN followup_question TEXT;

-- users에 스트릭 필드
ALTER TABLE users ADD COLUMN current_streak INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN longest_streak INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN last_diary_date DATE;
