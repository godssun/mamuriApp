-- 기억 계층 확장
ALTER TABLE user_memories
    ADD COLUMN memory_tier VARCHAR(15) NOT NULL DEFAULT 'SHORT_TERM',
    ADD COLUMN decay_score DOUBLE PRECISION NOT NULL DEFAULT 1.0;

CREATE INDEX idx_user_memories_tier ON user_memories(user_id, memory_tier, status);

-- 관계 단계 7단계로 확장 (기존 CHECK 제약이 있으면 제거 후 재추가)
-- 기존 데이터는 유지 (1-5 범위 그대로 유효)
-- 6: 영혼의 동반자, 7: 평생의 친구

-- 감정 통계 테이블
CREATE TABLE emotion_statistics (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    period_type VARCHAR(10) NOT NULL,
    period_key VARCHAR(10) NOT NULL,
    emotion_code VARCHAR(30) NOT NULL,
    count INT NOT NULL DEFAULT 0,
    avg_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, period_type, period_key, emotion_code)
);

CREATE INDEX idx_emotion_statistics_user ON emotion_statistics(user_id, period_type, period_key);
