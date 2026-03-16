-- ai_usage_log.diary_id FK에 ON DELETE SET NULL 추가
-- 일기 삭제 시 usage log는 보존하되 diary_id를 null로 설정
ALTER TABLE ai_usage_log DROP CONSTRAINT IF EXISTS ai_usage_log_diary_id_fkey;
ALTER TABLE ai_usage_log ADD CONSTRAINT ai_usage_log_diary_id_fkey
    FOREIGN KEY (diary_id) REFERENCES diaries(id) ON DELETE SET NULL;
