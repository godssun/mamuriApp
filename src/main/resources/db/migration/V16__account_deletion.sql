-- 계정 삭제 로그 테이블 (유저 삭제 후에도 분석용 데이터 보존)
CREATE TABLE IF NOT EXISTS account_deletion_logs (
    id BIGSERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    reason_detail TEXT,
    deleted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deletion_logs_deleted_at ON account_deletion_logs(deleted_at DESC);

-- subscription_events.user_id FK → ON DELETE SET NULL 추가
-- 유저 삭제 시 subscription_events는 보존하되 user_id를 null로 설정
ALTER TABLE subscription_events DROP CONSTRAINT IF EXISTS subscription_events_user_id_fkey;
ALTER TABLE subscription_events ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE subscription_events ADD CONSTRAINT subscription_events_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ai_usage_log.user_id NOT NULL 제거 + ON DELETE SET NULL 추가
ALTER TABLE ai_usage_log DROP CONSTRAINT IF EXISTS ai_usage_log_user_id_fkey;
ALTER TABLE ai_usage_log ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE ai_usage_log ADD CONSTRAINT ai_usage_log_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
