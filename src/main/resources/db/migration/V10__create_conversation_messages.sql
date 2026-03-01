-- 대화 메시지 테이블
CREATE TABLE IF NOT EXISTS conversation_messages (
    id BIGSERIAL PRIMARY KEY,
    diary_id BIGINT NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL CHECK (role IN ('USER', 'AI')),
    content TEXT NOT NULL,
    sequence_number INTEGER NOT NULL,
    model_name VARCHAR(100),
    prompt_version VARCHAR(50),
    token_count INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(diary_id, sequence_number)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_conv_msg_diary ON conversation_messages(diary_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_conv_msg_user ON conversation_messages(user_id, created_at DESC);
