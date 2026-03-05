-- V14: 구독 티어 재구조화 (MEDIUM → DELUXE, trial 필드 추가)

-- 1. MEDIUM → DELUXE 이름 변경
UPDATE users SET subscription_tier = 'DELUXE' WHERE subscription_tier = 'MEDIUM';

-- 2. Trial 필드 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP;

-- 3. 일별 조회 인덱스 추가 (사용자별 하루 AI 답변 수 카운트 최적화)
CREATE INDEX IF NOT EXISTS idx_conv_msg_user_daily
    ON conversation_messages(user_id, role, created_at);
