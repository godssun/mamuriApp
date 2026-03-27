-- ============================================================
-- V21: 감정 시스템 + 기억 시스템 + 관계 진화 + 리플렉션 리포트
-- ============================================================

-- 1. 일기별 감정 기록
CREATE TABLE diary_emotions (
    id              BIGSERIAL PRIMARY KEY,
    diary_id        BIGINT NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    primary_emotion VARCHAR(20) NOT NULL,
    secondary_emotions JSONB DEFAULT '[]',
    emotion_score   INT NOT NULL DEFAULT 3 CHECK (emotion_score BETWEEN 1 AND 5),
    ai_detected_emotion VARCHAR(20),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(diary_id)
);

CREATE INDEX idx_diary_emotions_user ON diary_emotions(user_id, created_at DESC);
CREATE INDEX idx_diary_emotions_emotion ON diary_emotions(primary_emotion, created_at DESC);

-- 2. AI 기억 시스템
CREATE TABLE user_memories (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    memory_type     VARCHAR(30) NOT NULL,
    content         TEXT NOT NULL,
    source_diary_id BIGINT REFERENCES diaries(id) ON DELETE SET NULL,
    importance      INT NOT NULL DEFAULT 1 CHECK (importance BETWEEN 1 AND 5),
    mention_count   INT NOT NULL DEFAULT 1,
    last_referenced_at TIMESTAMP,
    status          VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_memories_user ON user_memories(user_id, importance DESC);
CREATE INDEX idx_user_memories_status ON user_memories(user_id, status);

-- 3. 관계 단계 이력
CREATE TABLE relationship_stages (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stage           INT NOT NULL DEFAULT 1 CHECK (stage BETWEEN 1 AND 5),
    reached_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    trigger_reason  VARCHAR(100)
);

CREATE INDEX idx_rel_stages_user ON relationship_stages(user_id, reached_at DESC);

-- 4. 리플렉션 리포트
CREATE TABLE reflection_reports (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type     VARCHAR(20) NOT NULL,
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    title           VARCHAR(200),
    content         TEXT NOT NULL,
    emotion_summary JSONB DEFAULT '{}',
    key_events      JSONB DEFAULT '[]',
    growth_insight  TEXT,
    diary_count     INT NOT NULL DEFAULT 0,
    status          VARCHAR(10) NOT NULL DEFAULT 'GENERATED',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_user ON reflection_reports(user_id, created_at DESC);
CREATE INDEX idx_reports_type ON reflection_reports(user_id, report_type, period_start DESC);

-- 5. users 테이블에 관계 단계 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS relationship_stage INT NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP;
