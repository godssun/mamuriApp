-- users 테이블 구독/쿼터 필드 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) NOT NULL DEFAULT 'FREE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS quota_used INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS quota_reset_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS crisis_flag_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- subscription_events 테이블 (웹훅 멱등성)
CREATE TABLE IF NOT EXISTS subscription_events (
    id BIGSERIAL PRIMARY KEY,
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    user_id BIGINT REFERENCES users(id),
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ai_usage_log 테이블 (비용 추적)
CREATE TABLE IF NOT EXISTS ai_usage_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    diary_id BIGINT REFERENCES diaries(id),
    model_name VARCHAR(100),
    total_tokens INT,
    estimated_cost_krw DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_stripe ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_sub_events_stripe ON subscription_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_log(user_id, created_at DESC);
