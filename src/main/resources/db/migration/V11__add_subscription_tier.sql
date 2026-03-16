-- 구독 티어 컬럼 추가 (기존 subscription_status와 별개)
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) NOT NULL DEFAULT 'FREE';

-- 기존 프리미엄 사용자의 티어를 PREMIUM으로 설정
UPDATE users SET subscription_tier = 'PREMIUM'
WHERE subscription_status IN ('ACTIVE', 'TRIALING');

CREATE INDEX IF NOT EXISTS idx_users_tier ON users(subscription_tier);
